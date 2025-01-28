import { DB } from "https://deno.land/x/sqlite/mod.ts";

const sandboxItems = [
  {
    name: "Huntington",
    itemId: "NopMQyoGNNFxxBNnnVnesZ31orAEg9CWWrQqw",
    accessToken: "access-sandbox-7b96f67b-95b2-4f9c-85d0-a50ccd189840",
  },
  {
    name: "Capitalone",
    itemId: "x7GNPNoLnafDnRvXRAKoC3mwZaBGkXhnNkAL7",
    accessToken: "access-sandbox-0c3de7f9-3abd-4f95-86c6-d8e249b84b49",
  },
];

export function initDb(db: DB) {
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
  } catch (err) {
    console.log("error!", err);
    itemsAlreadyCreated = true;
  }

  try {
    db.execute(`
      CREATE TABLE accounts (
        account_id INTEGER PRIMARY KEY,
        item_id TEXT NOT NULL,
        name TEXT,
        FOREIGN KEY (item_id)
          REFERENCES items (item_id)
      );
    `);
    console.log("success!");
  } catch (err) {
    console.log("error!", err);
  }

  if (itemsAlreadyCreated) return;

  // Add Sandbox values
  for (const item of sandboxItems) {
    db.query(
      "INSERT INTO items (name, item_id, access_token) VALUES(?, ?, ?)",
      [item.name, item.itemId, item.accessToken]
    );
  }
}

export function queryDb(db: DB) {
  const results = [];
  for (const [name, itemId, accessToken] of db.query(
    "SELECT name, item_id as itemId, access_token as accessToken FROM items"
  ) as Iterable<[string, string, string]>) {
    results.push({
      name,
      itemId,
      accessToken,
    });
  }
  return results;
}
