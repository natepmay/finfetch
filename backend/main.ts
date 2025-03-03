import express from "npm:express";
import type { Request, Response, NextFunction } from "npm:express";
import cors from "npm:cors";
import bodyParser from "npm:body-parser";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  CountryCode,
  Products,
} from "npm:plaid";
import "jsr:@std/dotenv/load";
import * as zip from "jsr:@zip-js/zip-js";
import { dirname, join } from "jsr:@std/path";
import { fromFileUrl } from "jsr:@std/path/from-file-url";

import {
  initDb,
  getItems,
  addItem,
  addAccount,
  getAccounts,
  deleteItem,
  updateAccount,
  addSalt,
  getSalt,
  wipeData,
} from "./db.ts";
import { PlaidLinkOnSuccessMetadata } from "./types.ts";
import { syncTransactions } from "./plaid/plaidUtils.ts";
import { importKey } from "./utils/crypto.ts";

const app = express();
const port = 3002;

const __filename = fromFileUrl(import.meta.url);
const __dirname = dirname(__filename);
const frontendDistPath = join(__dirname, "../frontend/dist");

app.use(bodyParser.json());
// For security reasons, only use CORS during development. It's not needed when serving files from the dist folder.
app.use(cors());

initDb();
// TODO don't forget to close the db later

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
const PLAID_ENV = Deno.env.get("PLAID_ENV");
const PLAID_COUNTRY_CODES = (Deno.env
  .get("PLAID_COUNTRY_CODES")
  ?.split(",") || ["US", "CA"]) as CountryCode[];
const PLAID_PRODUCTS = ["transactions"] as Products[];

console.log("PLAID_SECRET", PLAID_SECRET);

const configuration = new Configuration({
  basePath: PlaidEnvironments[PLAID_ENV!],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const client = new PlaidApi(configuration);

app.use("/", express.static(frontendDistPath));

app.get("/", (_: Request, res: Response) => {
  res.sendFile(join(frontendDistPath, "index.html"));
});

app.get(
  "/api/sync",
  async (req: Request, res: Response, next: NextFunction) => {
    const cryptoKeyString = req.get("X-Crypto-Key-String");
    const cryptoKey = await importKey(cryptoKeyString);

    const items = await getItems(cryptoKey);

    const { dateQuery }: { dateQuery: "cursor" | "all" } = req.query;

    try {
      const { csvStrings, txnCount } = await syncTransactions(
        client,
        items,
        dateQuery === "cursor"
      );

      const accounts = getAccounts();
      const now = Date.now();
      accounts.forEach((account) =>
        updateAccount(account.accountId, { ...account, lastDownloaded: now })
      );

      const zipFileWriter = new zip.BlobWriter("application/zip");
      const zipWriter = new zip.ZipWriter(zipFileWriter);

      await Promise.all(
        Object.entries(csvStrings).map(([category, csv]) => {
          if (csv) {
            const csvReader = new zip.TextReader(csv);
            zipWriter.add(`${category}.csv`, csvReader);
          }
        })
      );

      const zipBlobFile = await zipWriter.close();
      const thingToSend = new Uint8Array(await zipBlobFile.arrayBuffer());

      res.set("Content-Disposition", 'attachment; filename="transactions.zip"');
      res.set("Content-Type", "application/zip");
      res.set("X-AddedCount", String(txnCount.added));
      res.set("X-ModifiedCount", String(txnCount.modified));
      res.set("X-RemovedCount", String(txnCount.removed));
      // required because of CORS
      res.set(
        "Access-Control-Expose-Headers",
        "X-AddedCount, X-ModifiedCount, X-RemovedCount, Content-Disposition"
      );

      // have to use end method here instead of send to ensure it's received as binary
      res.end(thingToSend);
    } catch (err) {
      next(err);
    }
  }
);

app.post(
  "/api/create_link_token",
  async function (_: Request, res: Response, next: NextFunction) {
    const configs = {
      user: {
        // currently hardcoded as "1" with the assumption of only one user
        client_user_id: "1",
      },
      client_name: "Finfetch",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
    };
    console.log("configs ", configs);
    try {
      const createTokenResponse = await client.linkTokenCreate(configs);
      res.json(createTokenResponse.data);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/items",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const cryptoKeyString = req.get("X-Crypto-Key-String");
      const cryptoKey = await importKey(cryptoKeyString);

      const items = await getItems(cryptoKey);
      const itemsFrontend = items.map((item) => ({
        itemId: item.itemId,
        name: item.name,
      }));
      res.json(itemsFrontend);
    } catch (error) {
      res.status(400).send();
      next(error);
    }
  }
);

app.get("/api/items/:itemId/accounts", function (req: Request, res: Response) {
  const { itemId } = req.params;
  const accounts = getAccounts(itemId);
  res.json(accounts);
});

app.post(
  "/api/create_access_token",
  async function (req: Request, res: Response, next: NextFunction) {
    const { publicToken, metadata, cryptoKeyString } = req.body as {
      publicToken: string;
      metadata: PlaidLinkOnSuccessMetadata;
      cryptoKeyString: string;
    };

    try {
      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      const { access_token, item_id } = tokenResponse.data;

      const cryptoKey = await importKey(cryptoKeyString);

      await addItem(
        { access_token, item_id, name: metadata.institution?.name },
        cryptoKey
      );

      for (const account of metadata.accounts) {
        addAccount({
          account_id: account.id,
          item_id: item_id,
          name: account.name + " " + account.mask,
          nickname: account.name + " " + account.mask,
        });
      }
      // Don't return the access token to the client for security reasons
      res.json({
        itemId: item_id,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.put(
  "/api/accounts/:accountId",
  function (req: Request, res: Response, next: NextFunction) {
    try {
      const resource = req.body;
      const { accountId } = req.params;
      const result = updateAccount(accountId, resource);
      res.json({
        rowsAffected: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/items/:itemId",
  async function (req: Request, res: Response, next: NextFunction) {
    try {
      const cryptoKeyString = req.get("X-Crypto-Key-String");
      const cryptoKey = await importKey(cryptoKeyString);

      const { itemId } = req.params;

      const items = await getItems(cryptoKey);
      const item = items.find((item) => item.itemId === itemId);
      if (!item) throw new Error("Requested item does not exist");

      await client.itemRemove({
        access_token: item.accessToken,
      });

      deleteItem(itemId);

      res.status(204).send("Deleted");
    } catch (error) {
      next(error);
    }
  }
);

app.post(
  "/api/users/create",
  function (_: Request, res: Response, next: NextFunction) {
    try {
      wipeData();
      const salt = crypto.getRandomValues(new Uint8Array(16));
      addSalt(salt);
      res.end(salt);
    } catch (error) {
      next(error);
    }
  }
);

app.get(
  "/api/users/1/salt",
  function (_: Request, res: Response, next: NextFunction) {
    try {
      const salt = getSalt(1);
      res.end(salt);
    } catch (error) {
      next(error);
    }
  }
);

app.delete(
  "/api/users/1",
  function (_: Request, res: Response, next: NextFunction) {
    try {
      wipeData();
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  }
);

// ------ BEGIN ENDPOINTS FOR TESTING
// reset an item to logged out state
app.post(
  "/api/sandbox/item/:accessToken/reset_login",
  async function (req: Request, res: Response) {
    const { accessToken } = req.params;
    const { data } = await client.sandboxItemResetLogin({
      access_token: accessToken,
    });
    res.json(data);
  }
);
// --------- END EDPOINTS FOR TESTING

app.use((err: Error, _: Request, res: Response, __: NextFunction) => {
  console.error(err.stack);
  res.status(500).send(err.message);
});

// localhost IP set explicitly to prevent access from other devices on the network
app.listen(port, "127.0.0.1", () => {
  console.log(`Finfetch listening on port ${port}`);
});
