import downloadAndSaveFile from "./utils/download.ts";
import { Item, Account } from "../../sharedTypes.ts";
import { deriveKey, exportKey } from "./utils/crypto.ts";
import { PlaidLinkOnSuccessMetadata } from "react-plaid-link";

const BASE_BACKEND_URL = "http://localhost:3002";

/**
 * Get all items from database.
 * @returns
 */
export async function getItems(cryptoKey: CryptoKey): Promise<Item[]> {
  const cryptoKeyString = await exportKey(cryptoKey);

  console.log("crypto key string client: ", cryptoKeyString);

  const res = await fetch(BASE_BACKEND_URL + "/api/getItems", {
    headers: {
      "X-Crypto-Key-String": cryptoKeyString,
      "Access-Control-Expose-Headers": "X-Crypto-Key-String",
    },
  });

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
  dateQuery: "cursor" | "all",
  cryptoKey: CryptoKey
): Promise<TxnCount> {
  const cryptoKeyString = await exportKey(cryptoKey);

  const txnCount = await downloadAndSaveFile(
    {
      url: `${BASE_BACKEND_URL}/api/sync?dateQuery=${dateQuery}`,
      defaultFileName: "transactions.zip",
    },
    cryptoKeyString
  );
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
export async function deleteItem(itemId: string, cryptoKey: CryptoKey) {
  const cryptoKeyString = await exportKey(cryptoKey);

  try {
    await fetch(`${BASE_BACKEND_URL}/api/items/${itemId}`, {
      method: "DELETE",
      headers: {
        "X-Crypto-Key-String": cryptoKeyString,
        "Access-Control-Expose-Headers": "X-Crypto-Key-String",
      },
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

export async function createAccessToken(
  publicToken: string,
  metadata: PlaidLinkOnSuccessMetadata,
  cryptoKey: CryptoKey
) {
  const cryptoKeyString = await exportKey(cryptoKey);

  const response = await fetch(BASE_BACKEND_URL + "/api/create_access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicToken: publicToken,
      metadata: metadata,
      cryptoKeyString: cryptoKeyString,
    }),
  });
  const data = (await response.json()) as { itemId: string };
  return data.itemId;
}

export async function createLinkToken() {
  const response = await fetch(BASE_BACKEND_URL + "/api/create_link_token", {
    method: "POST",
  });
  const { link_token } = (await response.json()) as { link_token: string };
  return link_token;
}
