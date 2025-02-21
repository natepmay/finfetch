import downloadAndSaveFile from "./utils/download.ts";
import { Item, Account } from "../../sharedTypes.ts";
import { deriveKey } from "./utils/crypto.ts";

const BASE_BACKEND_URL = "http://localhost:3002";

/**
 * Get all items from database.
 * @returns
 */
export async function getItems(): Promise<Item[]> {
  const res = await fetch(BASE_BACKEND_URL + "/api/getItems");
  if (!res.ok) {
    throw new Error("Failed to fetch items.");
  }
  const data: Item[] = await res.json();
  return data;
}

/**
 * Get accounts from database by itemId.
 * @param itemId
 * @returns
 */
export async function getAccounts(itemId: string): Promise<Account[]> {
  const url = new URL(`${BASE_BACKEND_URL}/api/getAccounts`);
  url.searchParams.append("itemId", itemId);
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error("Failed to fetch accounts.");
  }
  const data: Account[] = await res.json();
  return data;
}

export interface TxnCount {
  added: number;
  removed: number;
  modified: number;
}

/**
 * Call the sync endpoint and downloads the file.
 */
export async function downloadWrapper(
  dateQuery: "cursor" | "all"
): Promise<TxnCount> {
  const txnCount = await downloadAndSaveFile({
    url: `${BASE_BACKEND_URL}/api/sync?dateQuery=${dateQuery}`,
    defaultFileName: "transactions.zip",
  });
  return txnCount;
}

/**
 * Update an account in the database. This doesn't make any changes on the Plaid side.
 * @param resource account to change
 * @returns
 */
export async function updateAccount(resource: Account) {
  const res = await fetch(
    `${BASE_BACKEND_URL}/api/accounts/${resource.accountId}`,
    {
      method: "PUT",
      body: JSON.stringify(resource),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const numRows: number = await res.json();
  return numRows;
}

/**
 * Delete an item from database and remove the item on the Plaid side.
 * @param itemId itemId of item to delete
 */
export async function deleteItem(itemId: string) {
  try {
    await fetch(`${BASE_BACKEND_URL}/api/items/${itemId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(String(error));
  }
}

export async function initUser(password: string) {
  const resp = await fetch(`${BASE_BACKEND_URL}/api/users/create`, {
    method: "POST",
  });
  const arrayBuffer = await resp.arrayBuffer();
  const salt = new Uint8Array(arrayBuffer);

  const cryptoKey = await deriveKey(password, salt);

  // To test:
  // const { iv, encrypted } = await encryptData("hey hey hey", cryptoKey);
  // const decrypted = await decryptData(encrypted, iv, cryptoKey);
  // console.log(decrypted);

  return cryptoKey;
}

await initUser("balbalbala");
