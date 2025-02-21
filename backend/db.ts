import { DB } from "https://deno.land/x/sqlite/mod.ts";
import * as path from "jsr:@std/path";

import { Account, Item, ServerItem } from "../sharedTypes.ts";
import { camelToSnake } from "./utils/pureFns.ts";

const dbPath = path.resolve(import.meta.dirname || "", "db.db");
const db = new DB(dbPath);

/**
 * Create the SQLite tables.
 * @param db SQLite database instance.
 * @returns Nothing.
 */
export function initDb() {
  let itemsAlreadyCreated = false;

  try {
    db.execute(`
      CREATE TABLE items (
        item_id TEXT PRIMARY KEY,
        access_token TEXT,
        cursor TEXT,
        name TEXT
      );
    `);
    console.log("success!");
  } catch (_) {
    console.log("Items is already created :-) or maybe there's an error :-(");
    itemsAlreadyCreated = true;
  }

  try {
    db.execute(`
      CREATE TABLE accounts (
        account_id TEXT PRIMARY KEY,
        item_id TEXT NOT NULL,
        name TEXT,
        nickname TEXT,
        last_downloaded INTEGER,
        FOREIGN KEY (item_id)
          REFERENCES items (item_id)
      );
    `);
    console.log("success!");
  } catch (_) {
    console.log(
      "Accounts is already created :-) or maybe there's an error :-("
    );
  }

  try {
    db.execute(`
      CREATE TABLE users (
        user_id NUMBER PRIMARY KEY,
        salt BLOB NOT NULL
      );
    `);
    console.log("success!");
  } catch (_) {
    console.log("Users is already created :-) or maybe there's an error :-(");
  }

  if (itemsAlreadyCreated) return;
}

/**
 * Add an item to the database.
 * @param db databse instance.
 * @param item
 */
export function addItem(item: {
  item_id: string;
  access_token: string;
  name?: string;
}) {
  db.query("INSERT INTO items (item_id, access_token, name) VALUES(?, ?, ?)", [
    item.item_id,
    item.access_token,
    item.name ?? null,
  ]);
}
/**
 * Add an account to the database.
 * @param db database instance.
 * @param account
 */
export function addAccount(account: {
  account_id: string;
  item_id: string;
  name?: string;
  nickname?: string;
}) {
  const { account_id, item_id, name, nickname } = account;

  db.query(
    "INSERT INTO accounts (account_id, item_id, name, nickname) VALUES(?, ?, ?, ?)",
    [account_id, item_id, name ?? null, nickname ?? name ?? null]
  );
}

/**
 * Get all items from database.
 * @param db database instance
 * @returns array of items. Remove access token before sending to client.
 */
export function getItems(): ServerItem[] {
  const results = [];

  for (const [name, itemId, accessToken, cursor] of db.query(
    "SELECT name, item_id as itemId, access_token as accessToken, cursor FROM items"
  ) as Iterable<[string, string, string, string]>) {
    results.push({ name, itemId, accessToken, cursor });
  }

  return results;
}

/**
 * Get accounts from the database.
 * @param db database instance.
 * @param requestedItemId If blank, get all accounts.
 * @returns List of accounts.
 */
export function getAccounts(requestedItemId?: string): Account[] {
  const results = [];

  let query = `
    SELECT name, nickname, account_id as accountId, item_id as itemId, last_downloaded as lastDownloaded FROM accounts
    `;
  const queryParams = [];
  if (requestedItemId) {
    query += ` WHERE item_id = ?`;
    queryParams.push(requestedItemId);
  }

  for (const [name, nickname, accountId, itemId, lastDownloaded] of db.query(
    query,
    queryParams
  ) as Iterable<[string, string, string, string, number | null]>) {
    results.push({ name, nickname, accountId, itemId, lastDownloaded });
  }

  return results;
}

/**
 * Update an account.
 * @param db database instance
 * @param accountId
 * @param resourceIn updated account object. accountId property is used to locate.
 * @returns
 */
export function updateAccount(accountId: string, resourceIn: Account) {
  if (accountId !== resourceIn.accountId)
    throw new Error("Account ids don't match.");
  const resource: Partial<Account> = { ...resourceIn };
  delete resource.accountId;

  const fields = Object.keys(resource).map((field) => camelToSnake(field));
  const values = Object.values(resource);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const sql = `UPDATE accounts SET ${setClause} WHERE account_id = ?`;

  db.query(sql, [...values, accountId]);

  // TODO return something that's not this
  return 1;
}

export function updateItem(itemId: string, resourceIn: ServerItem) {
  if (itemId !== resourceIn.itemId) throw new Error("Item ids don't match.");
  const resource: Partial<Item> = { ...resourceIn };
  delete resource.itemId;

  const fields = Object.keys(resource).map((field) => camelToSnake(field));
  const values = Object.values(resource);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const sql = `UPDATE items SET ${setClause} WHERE item_id = ?`;

  db.query(sql, [...values, itemId]);

  // TODO return something that's not this
  return 1;
}

/**
 * Remove an item from the database.
 * @param db database instance.
 * @param itemId itemId of item to delete.
 * @returns
 */
export function deleteItem(itemId: string) {
  const deletedRows = db.query(`DELETE from accounts WHERE item_id = ?`, [
    itemId,
  ]);
  db.query(`DELETE from items WHERE item_id = ?`, [itemId]);
  return deletedRows.length;
}

/**
 * Lookup full info about an account.
 * @param db
 * @param accountId
 * @returns
 */
export function getAccountById(accountId: string): Account {
  const accountIdToQuery = accountId;

  const query = `
  SELECT account_id as accountId, name, nickname, item_id as itemId, last_downloaded as lastDownloaded 
  FROM accounts
  WHERE account_id = ?
  `;

  const results = [];

  for (const [accountId, name, nickname, itemId, lastDownloaded] of db.query(
    query,
    [accountIdToQuery]
  ) as Iterable<[string, string, string, string, number]>) {
    results.push({ accountId, name, nickname, itemId, lastDownloaded });
  }

  return results[0];
}

export function addSalt(salt: Uint8Array) {
  db.query("REPLACE INTO users (user_id, salt) VALUES(1, ?)", [salt]);
}
