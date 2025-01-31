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
import { initDb, queryDb, addItem } from "./db.ts";
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

app.post("/api/sync", async (_: express.Request, res: express.Response) => {
  const items = queryDb(db);
  const itemResults = [];
  for (const item of items) {
    itemResults.push(await syncTransactions(item));
  }
  res.json(itemResults);
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

app.post(
  "/api/create_access_token",
  async function (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    // lower snake case for request?
    console.log(req.body);
    const publicToken = req.body.publicToken;
    try {
      const tokenResponse = await client.itemPublicTokenExchange({
        public_token: publicToken,
      });
      const { access_token, item_id } = tokenResponse.data;
      addItem(db, { access_token, item_id });
      // Don't return the access token to the client for security reasons
      res.json({
        itemId: item_id,
      });
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

async function syncTransactions(item: {
  name: string;
  itemId: string;
  accessToken: string;
}) {
  const simplifyTransactions = (transactions: Transaction[]) => {
    return transactions.map((transaction: Transaction) => {
      return SimpleTransaction.fromPlaidTransaction(transaction);
    });
  };

  const rawData = await fetchNewSyncData(item.accessToken, "");

  const simpleData = {
    added: simplifyTransactions(rawData.added),
    removed: rawData.removed,
    modified: simplifyTransactions(rawData.modified),
    nextCursor: rawData.nextCursor,
    itemName: item.name,
  };

  const csvString = stringify(simpleData.added, {
    columns: Object.keys(simpleData.added[0]),
  });

  console.log(csvString);

  await Deno.writeTextFile("./out/added.csv", csvString);
  // TODO support removed (maybe just reverse the transaction?), modified
  // explore the import in hledger to see what would make sense as default

  return simpleData;
}
