import { Transaction } from "npm:plaid";

import { getAccountById, getAccounts } from "../db.ts";

let accountNicknameById: Map<string, string> | null = null;

export function primeAccountNicknameCache(): void {
  accountNicknameById = new Map();
  for (const a of getAccounts()) {
    accountNicknameById.set(a.accountId, a.nickname ?? a.name);
  }
}

export function clearAccountNicknameCache(): void {
  accountNicknameById = null;
}

const getNickname = (accountId: string) => {
  if (accountNicknameById !== null) {
    const cached = accountNicknameById.get(accountId);
    if (cached !== undefined) return cached;
  }
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
    } else if (["string", "number", "boolean"].includes(typeof value)) {
      newObj[key] = value ? String(value) : "";
    } else {
      throw new Error(
        `Transaction object includes an unexpected type. Type: ${typeof value}. Key: ${key}. Value: ${value}`
      );
    }
  }

  return newObj;
}
