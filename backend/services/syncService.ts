import { PlaidApi } from "npm:plaid";
import { ServerItem } from "../../sharedTypes.ts";
import { getAccounts, updateAccount } from "../db.ts";
import { syncTransactions } from "../plaid/plaidUtils.ts";

export type SyncResult = Awaited<ReturnType<typeof syncTransactions>>;

export async function runTransactionSync(
  client: PlaidApi,
  items: ServerItem[],
  useCursor: boolean,
  parallelItemSync = true,
): Promise<SyncResult> {
  const { csvStrings, txnCount } = await syncTransactions(
    client,
    items,
    useCursor,
    parallelItemSync,
  );

  const accounts = getAccounts();
  const now = Date.now();
  accounts.forEach((account) =>
    updateAccount(account.accountId, { ...account, lastDownloaded: now })
  );

  return { csvStrings, txnCount };
}
