import { RemovedTransaction, Transaction, PlaidApi } from "npm:plaid";
import { processTransaction } from "./simpleTransactionObject.ts";
import { updateItem } from "../db.ts";
import { stringify } from "jsr:@std/csv";
import { ServerItem } from "../../sharedTypes.ts";

async function fetchNewSyncData(
  client: PlaidApi,
  item: ServerItem,
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
    // console.error("Too many retries!");
    // We're just going to return no data and keep our original cursor. We can try again later.
    throw new Error(
      `We were not able to get the transactions for ${item.name}. Please remove this bank and add it again.`
    );
  }
  try {
    let keepGoing = false;
    do {
      const results = await client.transactionsSync({
        access_token: item.accessToken,
        count: 500,
        options: {
          include_original_description: true,
          days_requested: 730,
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
      )} Let's try again from the beginning!\n`
    );
    setTimeout(() => {}, 1000);
    return fetchNewSyncData(client, item, initialCursor, retriesLeft - 1);
  }
}

export async function syncTransactions(
  client: PlaidApi,
  items: ServerItem[],
  useCursor: boolean
) {
  const processAllTransactions = (transactions: Transaction[]) => {
    return transactions.map((transaction: Transaction) => {
      return processTransaction(transaction);
    });
  };

  const eachItemData = await Promise.all(
    items.map(async (item) => {
      const cursor = useCursor ? item.cursor : "";
      const rawData = await fetchNewSyncData(client, item, cursor);
      updateItem(item.itemId, { ...item, cursor: rawData.nextCursor });
      return {
        added: processAllTransactions(rawData.added),
        removed: rawData.removed,
        modified: processAllTransactions(rawData.modified),
      };
    })
  );

  type Category = "added" | "removed" | "modified";

  const combinedData: Record<
    Category,
    { [key: string]: string }[] | RemovedTransaction[]
  > = eachItemData.reduce(
    (acc, data) => ({
      added: [...acc.added, ...data.added],
      removed: [...acc.removed, ...data.removed],
      modified: [...acc.modified, ...data.modified],
    }),
    {
      added: [],
      removed: [],
      modified: [],
    }
  );

  const makeCsvString = (
    dataIn: RemovedTransaction[] | { [key: string]: string }[]
  ) => {
    return stringify(dataIn as { [key: string]: string }[], {
      columns: Object.keys(dataIn[0]),
    });
  };

  const txnCount: Record<Category, number> = {
    added: 0,
    removed: 0,
    modified: 0,
  };
  const csvStrings: Record<Category, string | null> = {
    added: null,
    removed: null,
    modified: null,
  };

  for (const category of Object.keys(combinedData) as Category[]) {
    const thisTxnCount = combinedData[category as Category].length;
    txnCount[category] = thisTxnCount;

    if (thisTxnCount > 0) {
      csvStrings[category] = makeCsvString(combinedData[category]);
    }
  }

  return { txnCount, csvStrings };
}
