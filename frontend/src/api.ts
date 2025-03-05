import downloadAndSaveFile from "./utils/download.ts";
import { Item, Account } from "../../sharedTypes.ts";
import { deriveKey, exportKey } from "./utils/crypto.ts";
import { PlaidLinkOnSuccessMetadata } from "react-plaid-link";

const BASE_BACKEND_URL = "http://localhost:3002";

/**
 * Get all items from database.
 * @param cryptoKey
 * @returns
 */
export async function getItems(cryptoKey: CryptoKey): Promise<Item[]> {
  const cryptoKeyString = await exportKey(cryptoKey);

  const res = await fetch(BASE_BACKEND_URL + "/api/items", {
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
  const res = await fetch(`${BASE_BACKEND_URL}/api/items/${itemId}/accounts`);
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
 * Call the sync endpoint and download the file.
 * @param dateQuery Retrieve transactions since last download ("cursor") or as far back as possible ("all")
 * @param cryptoKey
 * @returns Object with counts of added, modified, and deleted transactions.
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

/**
 * Wipes data and initiates a new user with the given password.
 * @param password
 * @returns cryptoKey to add to the app's state.
 */
export async function initUser(password: string) {
  const resp = await fetch(`${BASE_BACKEND_URL}/api/users/create`, {
    method: "POST",
  });
  const arrayBuffer = await resp.arrayBuffer();
  const salt = new Uint8Array(arrayBuffer);

  const cryptoKey = await deriveKey(password, salt);

  return cryptoKey;
}

/**
 * Create an access token for an Item and add it to the database. Call on successful completion of a link flow to add an Item.
 * @param publicToken provided from Plaid for exchange purposes
 * @param metadata from Plaid
 * @param cryptoKey
 * @returns itemId of the item added
 */
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

/**
 * Create a token that allows Plaid Link to open.
 * @returns
 */
export async function createLinkToken() {
  const response = await fetch(BASE_BACKEND_URL + "/api/create_link_token", {
    method: "POST",
  });
  const { link_token } = (await response.json()) as { link_token: string };
  return link_token;
}

/**
 * Retrieve the password salt from the user database.
 * @returns
 */
export async function getSalt() {
  try {
    const saltRaw = await fetch(BASE_BACKEND_URL + "/api/users/1/salt", {
      method: "GET",
    });
    if (!saltRaw.ok) throw new Error("no salt");
    const saltBuffer = await saltRaw.arrayBuffer();
    const salt = new Uint8Array(saltBuffer);
    return salt;
  } catch (err) {
    throw new Error(String(err));
  }
}

/**
 * Check if the entered password is correct, and return the cryptoKey if so.
 * @param password
 * @returns
 */
export async function authenticate(password: string) {
  const salt = await getSalt();

  const cryptoKey = await deriveKey(password, salt);

  try {
    // will error if decryption fails
    await getItems(cryptoKey);
    return cryptoKey;
  } catch {
    return null;
  }
}

/**
 * Remove all data from the database. This is done implicitly during user initiation, but should be called explicitly when a user runs out of password retries.
 */
export async function wipeData() {
  try {
    const res = await fetch(`${BASE_BACKEND_URL}/api/users/1`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Unable to delete");
  } catch (err) {
    throw new Error(String(err));
  }
}
