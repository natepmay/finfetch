import express from "npm:express";
import { Request, Response, NextFunction } from "npm:@types/express";
import cors from "npm:cors";
import bodyParser from "npm:body-parser";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  CountryCode,
  Products,
} from "npm:plaid";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import "jsr:@std/dotenv/load";

import {
  initDb,
  getItems,
  addItem,
  addAccount,
  getAccounts,
  deleteItem,
  updateAccount,
} from "./db.ts";
import { PlaidLinkOnSuccessMetadata } from "./types.ts";
import { syncTransactions } from "./plaid/plaidUtils.ts";

const app = express();
const port = 3002;

app.use(bodyParser.json());
// CORS is needed to talk to the frontend. Access is restricted to requests
// from the same machine by explicitly setting the localhost IP in app.listen() below.
app.use(cors());

const db = new DB("db.db");
initDb(db);
// TODO don't forget to close the db later

const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
const PLAID_ENV = Deno.env.get("PLAID_ENV");
const PLAID_COUNTRY_CODES = Deno.env
  .get("PLAID_COUNTRY_CODES")
  ?.split(",") as CountryCode[];
const PLAID_PRODUCTS = Deno.env.get("PLAID_PRODUCTS")?.split(",") as Products[];

console.log("PLAID_CLIENT_ID", PLAID_CLIENT_ID);

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

app.get("/api/sync", async (_: Request, res: Response) => {
  const items = getItems(db);
  const csvString = await syncTransactions(client, items);
  res.attachment("combined.csv").send(csvString);
});

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
    try {
      const createTokenResponse = await client.linkTokenCreate(configs);
      res.json(createTokenResponse.data);
    } catch (error) {
      next(error);
    }
  }
);

// probably should just be "/api/items"
app.get("/api/getItems", function (_: Request, res: Response) {
  const items = getItems(db);
  const itemsFrontend = items.map((item) => ({
    itemId: item.itemId,
    name: item.name,
  }));
  res.json(itemsFrontend);
});

app.get(
  // maybe this should be "/api/items/:itemId/accounts"
  "/api/getAccounts",
  function (req: Request, res: Response) {
    const itemId = req.query.itemId as string;
    const accounts = getAccounts(db, itemId);
    res.json(accounts);
  }
);

app.post(
  "/api/create_access_token",
  async function (req: Request, res: Response, next: NextFunction) {
    const { publicToken, metadata } = req.body as {
      publicToken: string;
      metadata: PlaidLinkOnSuccessMetadata;
    };
    try {
      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      const { access_token, item_id } = tokenResponse.data;
      addItem(db, { access_token, item_id, name: metadata.institution?.name });
      for (const account of metadata.accounts) {
        addAccount(db, {
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
      const result = updateAccount(db, accountId, resource);
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
      const { itemId } = req.params;
      const item = getItems(db).find((item) => item.itemId === itemId);
      if (!item) throw new Error("Requested item does not exist");
      await client.itemRemove({
        access_token: item.accessToken,
      });
      deleteItem(db, itemId);
      res.status(204).send("Deleted");
    } catch (error) {
      next(error);
    }
  }
);

// for testing: get a user token so you can call client.userItemsGet
app.post("/api/user/1/create", async function (_: Request, res: Response) {
  try {
    const resp = await client.userCreate({ client_user_id: "1" });
    console.log(resp);
    res.json(resp.data);
  } catch (error) {
    console.log(error);
    res.status(400).send("error");
  }
});

// for testing: add your user token here when it's returned from client.userCreate
const USER_TOKEN = "";
app.get("/api/user/1/items", async function (_: Request, res: Response) {
  const { data } = await client.userItemsGet({
    user_token: USER_TOKEN,
  });
  console.log(data);
  res.json(data);
});

// localhost IP set explicitly to prevent access from other devices on the network
app.listen(port, "127.0.0.1", () => {
  console.log(`Finfetch listening on port ${port}`);
});
