import express from "npm:express";
import cors from "npm:cors";
import bodyParser from "npm:body-parser";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  RemovedTransaction,
  Transaction,
  CountryCode,
  Products,
} from "npm:plaid";
import { SimpleTransaction } from "./simpleTransactionObject.ts";
import { stringify } from "jsr:@std/csv";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
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
import "jsr:@std/dotenv/load";

const app = express();
const port = 3002;

app.use(bodyParser.json());
// CORS is enabled when running locally
// For security, turn off if ever deployed publicly
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

app.get("/api/sync", async (_: express.Request, res: express.Response) => {
  const items = getItems(db);
  const csvString = await syncTransactions(items);
  console.log(csvString);
  res.attachment("combined.csv").send(csvString);
});

app.post(
  "/api/create_link_token",
  async function (
    _: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
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
    console.log(configs);
    try {
      const createTokenResponse = await client.linkTokenCreate(configs);
      res.json(createTokenResponse.data);
    } catch (error) {
      next(error);
    }
  }
);

app.get("/api/getItems", function (_: express.Request, res: express.Response) {
  const items = getItems(db);
  const itemsFrontend = items.map((item) => ({
    itemId: item.itemId,
    name: item.name,
  }));
  res.json(itemsFrontend);
});

app.get(
  "/api/getAccounts",
  function (req: express.Request, res: express.Response) {
    const itemId: string = req.query.itemId;
    const accounts = getAccounts(db, itemId);
    res.json(accounts);
  }
);

app.post(
  "/api/create_access_token",
  async function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
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
  function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const resource = req.body;
      console.log("resource in main.ts: ", resource);
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
  async function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function fetchNewSyncData(
  accessToken: string,
  initialCursor: string,
  retriesLeft = 3
) {
  const allData = {
    added: [] as Transaction[],
    removed: [] as RemovedTransaction[],
    modified: [] as Transaction[],
    nextCursor: initialCursor,
  };
  if (retriesLeft <= 0) {
    console.error("Too many retries!");
    // We're just going to return no data and keep our original cursor. We can try again later.
    return allData;
  }
  try {
    let keepGoing = false;
    do {
      const results = await client.transactionsSync({
        access_token: accessToken,
        options: {
          include_personal_finance_category: true,
        },
        cursor: allData.nextCursor,
      });
      const newData = results.data;
      allData.added = allData.added.concat(newData.added);
      allData.modified = allData.modified.concat(newData.modified);
      allData.removed = allData.removed.concat(newData.removed);
      allData.nextCursor = newData.next_cursor;
      keepGoing = newData.has_more;
      console.log(
        `Added: ${newData.added.length} Modified: ${newData.modified.length} Removed: ${newData.removed.length} `
      );

      // if (Math.random() < 0.5) {
      //   throw new Error("SIMULATED PLAID SYNC ERROR");
      // }
    } while (keepGoing === true);
    return allData;
  } catch (error) {
    // If you want to see if this is a sync mutation error, you can look at
    // error?.response?.data?.error_code
    console.log(
      `Oh no! Error! ${JSON.stringify(
        error
      )} Let's try again from the beginning!`
    );
    setTimeout(() => {}, 1000);
    return fetchNewSyncData(accessToken, initialCursor, retriesLeft - 1);
  }
}

// TODO consolidate with frontend version
interface Item {
  name: string;
  itemId: string;
  accessToken: string;
}

async function syncTransactions(items: Item[]) {
  const simplifyTransactions = (transactions: Transaction[]) => {
    return transactions.map((transaction: Transaction) => {
      return SimpleTransaction.fromPlaidTransaction(transaction);
    });
  };

  // TODO get the cursor for each item and store it
  // TODO currently we add the account id but we want the account name

  const eachItemData = await Promise.all(
    items.map(async (item) => {
      const rawData = await fetchNewSyncData(item.accessToken, "");
      return {
        added: simplifyTransactions(rawData.added),
        removed: rawData.removed,
        modified: simplifyTransactions(rawData.modified),
      };
    })
  );

  const combinedData = eachItemData.reduce((acc, data) => ({
    added: [...acc.added, ...data.added],
    removed: [...acc.removed, ...data.removed],
    modified: [...acc.modified, ...data.modified],
  }));

  const csvString = stringify(combinedData.added, {
    columns: Object.keys(combinedData.added[0]),
  });

  // await Deno.writeTextFile("./out/added.csv", csvString);
  // TODO support removed (maybe just reverse the transaction?), modified
  // explore the import in hledger to see what would make sense as default

  return csvString;
}
