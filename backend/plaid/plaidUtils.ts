import { RemovedTransaction, Transaction, PlaidApi } from "npm:plaid";
import {
  clearAccountNicknameCache,
  primeAccountNicknameCache,
  processTransaction,
} from "./simpleTransactionObject.ts";
import { updateItem } from "../db.ts";
import { stringify } from "jsr:@std/csv";
import { ServerItem } from "../../sharedTypes.ts";

// #region agent log
const AGENT_LOG = new URL("../../.cursor/debug-f8201e.log", import.meta.url);
function agentLog(entry: {
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  runId?: string;
}) {
  const line = JSON.stringify({
    sessionId: "f8201e",
    runId: entry.runId ?? "post-fix",
    hypothesisId: entry.hypothesisId,
    location: entry.location,
    message: entry.message,
    data: entry.data,
    timestamp: Date.now(),
  }) + "\n";
  Deno.writeTextFile(AGENT_LOG, line, { append: true }).catch(() => {});
}
// #endregion

async function fetchNewSyncData(
  client: PlaidApi,
  item: ServerItem,
  initialCursor: string,
  retriesLeft = 3
) {
  // #region agent log
  agentLog({
    hypothesisId: "H3",
    location: "plaidUtils.ts:fetchNewSyncData:entry",
    message: "sync entry",
    data: {
      itemName: item.name,
      cursorLen: initialCursor.length,
      cursorIsEmptyString: initialCursor === "",
      retriesLeft,
    },
  });
  // #endregion
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
    let pageIndex = 0;
    do {
      // #region agent log
      agentLog({
        hypothesisId: "H1-H2-H5",
        location: "plaidUtils.ts:fetchNewSyncData:beforeSync",
        message: "transactionsSync request shape",
        data: {
          itemName: item.name,
          count: 500,
          daysRequested: 730,
          includeOriginalDescription: true,
          cursorLen: allData.nextCursor.length,
          pageIndex,
        },
      });
      // #endregion
      const syncStarted = Date.now();
      const heartbeat = setInterval(() => {
        // #region agent log
        agentLog({
          hypothesisId: "H-NET",
          location: "plaidUtils.ts:fetchNewSyncData:heartbeat",
          message: "transactionsSync still awaiting response",
          data: {
            itemName: item.name,
            pageIndex,
            elapsedWaitingMs: Date.now() - syncStarted,
          },
        });
        // #endregion
      }, 5_000);
      let results;
      try {
        results = await client.transactionsSync({
          access_token: item.accessToken,
          count: 500,
          options: {
            include_original_description: true,
            days_requested: 730,
          },
          cursor: allData.nextCursor,
        });
      } finally {
        clearInterval(heartbeat);
      }
      const durationMs = Date.now() - syncStarted;
      const newData = results.data;
      // #region agent log
      agentLog({
        hypothesisId: "H-PAGE",
        location: "plaidUtils.ts:fetchNewSyncData:afterSync",
        message: "transactionsSync page completed",
        data: {
          itemName: item.name,
          pageIndex,
          durationMs,
          hasMore: newData.has_more,
          addedN: newData.added?.length ?? 0,
          modifiedN: newData.modified?.length ?? 0,
          removedN: newData.removed?.length ?? 0,
        },
      });
      // #endregion
      console.error(
        `[finfetch] ${item.name}: transactions page ${pageIndex} finished in ${durationMs}ms (batch +${newData.added.length} added, has_more=${newData.has_more})`,
      );
      allData.added = allData.added.concat(newData.added);
      allData.modified = allData.modified.concat(newData.modified);
      allData.removed = allData.removed.concat(newData.removed);
      allData.nextCursor = newData.next_cursor;
      keepGoing = newData.has_more;
      console.log(
        `Added: ${newData.added.length} Modified: ${newData.modified.length} Removed: ${newData.removed.length} `
      );
      pageIndex += 1;

      // if (Math.random() < 0.5) {
      //   throw new Error("SIMULATED PLAID SYNC ERROR");
      // }
    } while (keepGoing === true);
    return allData;
  } catch (error) {
    // #region agent log
    {
      const ax = error as {
        response?: {
          status?: number;
          data?: Record<string, unknown>;
        };
      };
      const d = ax.response?.data;
      const plaid = d && typeof d === "object"
        ? {
          error_type: d.error_type,
          error_code: d.error_code,
          error_message: d.error_message,
          display_message: d.display_message,
          request_id: d.request_id,
        }
        : null;
      agentLog({
        hypothesisId: "H1-H2-H4",
        location: "plaidUtils.ts:fetchNewSyncData:catch",
        message: "transactionsSync error response",
        data: {
          itemName: item.name,
          httpStatus: ax.response?.status ?? null,
          plaid,
        },
      });
    }
    // #endregion
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
  useCursor: boolean,
  parallelItemSync = true,
) {
  primeAccountNicknameCache();
  try {
    const processAllTransactions = (transactions: Transaction[]) => {
      return transactions.map((transaction: Transaction) => {
        return processTransaction(transaction);
      });
    };

    const syncOne = async (item: ServerItem) => {
      // #region agent log
      agentLog({
        hypothesisId: "H-SYNC1",
        location: "plaidUtils.ts:syncOne:start",
        message: "syncOne started",
        data: { itemName: item.name },
      });
      // #endregion
      const cursor = useCursor ? item.cursor : "";
      const rawData = await fetchNewSyncData(client, item, cursor);
      // #region agent log
      agentLog({
        hypothesisId: "H-SYNC1",
        location: "plaidUtils.ts:syncOne:afterFetch",
        message: "fetchNewSyncData returned",
        data: {
          itemName: item.name,
          addedN: rawData.added.length,
          modifiedN: rawData.modified.length,
        },
      });
      // #endregion
      updateItem(item.itemId, { ...item, cursor: rawData.nextCursor });
      // #region agent log
      agentLog({
        hypothesisId: "H-SYNC1",
        location: "plaidUtils.ts:syncOne:afterUpdateItem",
        message: "updateItem done",
        data: { itemName: item.name },
      });
      // #endregion
      const added = processAllTransactions(rawData.added);
      const modified = processAllTransactions(rawData.modified);
      // #region agent log
      agentLog({
        hypothesisId: "H-SYNC1",
        location: "plaidUtils.ts:syncOne:afterProcess",
        message: "processAllTransactions done",
        data: {
          itemName: item.name,
          addedOut: added.length,
          modifiedOut: modified.length,
        },
      });
      // #endregion
      return {
        added,
        removed: rawData.removed,
        modified,
      };
    };

    const eachItemData = parallelItemSync
      ? await Promise.all(items.map(syncOne))
      : await (async () => {
        const out: Awaited<ReturnType<typeof syncOne>>[] = [];
        for (const item of items) {
          out.push(await syncOne(item));
        }
        return out;
      })();

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
  } finally {
    clearAccountNicknameCache();
  }
}
