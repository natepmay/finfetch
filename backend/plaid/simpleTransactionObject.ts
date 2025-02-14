import { Transaction } from "npm:plaid";

import { getAccountById } from "../db.ts";

/**
 * A simple object to pass to our database functions that represents the data
 *  our application cares about from the Plaid transaction endpoint
 */
export class SimpleTransaction {
  [key: string]: unknown;
  public accountNickname: string;

  constructor(
    public id: string,
    accountId: string,
    public category: string | undefined,
    public date: string,
    public authorizedDate: string | null,
    public name: string | null | undefined,
    public amount: number,
    public currencyCode: string | null,
    public pendingTransactionId: string | null
  ) {
    this.accountNickname = SimpleTransaction.getNickname(accountId);
  }

  /**
   * Static factory method for creating the SimpleTransaction object
   *
   * @param {import("plaid").Transaction} txnObj The transaction object returned from the Plaid API
   * @returns SimpleTransaction
   */
  static fromPlaidTransaction(txnObj: Transaction) {
    return new SimpleTransaction(
      txnObj.transaction_id,
      txnObj.account_id,
      txnObj.personal_finance_category?.primary,
      txnObj.date,
      txnObj.authorized_date,
      txnObj.merchant_name,
      txnObj.amount,
      txnObj.iso_currency_code,
      txnObj.pending_transaction_id
    );
  }

  static getNickname(accountId: string) {
    const account = getAccountById(accountId);
    return account.nickname ?? account.name;
  }
}

const transactionFieldsForHumans = {
  accountNickname: {
    text: "Account",
    order: 3,
  },
  id: "Transaction ID",
  category: "Category",
  date: "Transaction Date",
  authorizedDate: "Authorized Date",
};

// also include
// pending
// original_description
// personal_finance_category.primary
// ".detailed
// ".confidence_level

/*

Order:
1. authorized_date  Date of Transaction
2. date             Date Posted or Pending
3. 

ON SECOND THOUGHT JUST DUMP EVERYTHING. IT'S DATA. IF YOU DON'T LIKE IT DON'T USE IT.

*/
