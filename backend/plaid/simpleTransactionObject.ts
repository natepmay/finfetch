import { Transaction } from "npm:plaid";

import { getAccountById } from "../db.ts";

const getNickname = (accountId: string) => {
  const account = getAccountById(accountId);
  return account.nickname ?? account.name;
};

export function processTransaction(txnObj: Transaction) {
  const newObj: { [key: string]: string } = {};

  const deprecated = new Set([
    "category",
    "category_id",
    "transaction_type",
    "counterparties",
  ]);

  newObj.account_nickname = getNickname(txnObj.account_id);

  for (const [key, value] of Object.entries(txnObj)) {
    if (deprecated.has(key)) continue;
    // need nullish test first because null is of type object
    if (!value) {
      newObj[key] = "";
    } else if (typeof value === "object") {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        newObj[key + "-" + nestedKey] = nestedValue ? String(nestedValue) : "";
      }
    } else if (["string", "number"].includes(typeof value)) {
      newObj[key] = value ? String(value) : "";
    } else {
      throw new Error(
        `Transaction object includes an unexpected type. Type: ${typeof value}`
      );
    }
  }

  return newObj;
}
