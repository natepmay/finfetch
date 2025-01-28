import express from "npm:express";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  RemovedTransaction,
  Transaction,
} from "npm:plaid";
import { SimpleTransaction } from "./simpleTransactionObject.ts";
import { stringify } from "jsr:@std/csv";
import { DB } from "https://deno.land/x/sqlite/mod.ts";
import { initDb, queryDb } from "./db.ts";

const app = express();
const port = 3002;

const db = new DB("db.db");
initDb(db);
// TODO don't forget to close the db later

// TODO put these in .env (also regenerate)
const PLAID_CLIENT_ID = "678c42d1e54ee60025166d12";
const PLAID_SECRET = "5446e8b0ba7593997ef974bf4c7f08";

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
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
