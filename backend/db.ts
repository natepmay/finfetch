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

  if (itemsAlreadyCreated) return;

  // Add Sandbox values
  for (const item of sandboxItems) {
    db.query(
      "INSERT INTO items (name, item_id, access_token) VALUES(?, ?, ?)",
      [item.name, item.itemId, item.accessToken]
    );
  }
}

export function addItem(
  db: DB,
  item: { item_id: string; access_token: string; name?: string }
) {
  db.query("INSERT INTO items (item_id, access_token, name) VALUES(?, ?, ?)", [
    item.item_id,
    item.access_token,
    item.name ?? null,
  ]);
}

export function addAccount(
  db: DB,
  account: {
    account_id: string;
    item_id: string;
    name?: string;
    nickname?: string;
  }
) {
  console.log("account:", account);
  const { account_id, item_id, name, nickname } = account;
  db.query(
    "INSERT INTO accounts (account_id, item_id, name, nickname) VALUES(?, ?, ?, ?)",
    [account_id, item_id, name ?? null, nickname ?? name ?? null]
  );
}

export function getItems(db: DB) {
  const results = [];
  for (const [name, itemId, accessToken, cursor] of db.query(
    "SELECT name, item_id as itemId, access_token as accessToken, cursor FROM items"
  ) as Iterable<[string, string, string, string]>) {
    results.push({
      name,
      itemId,
      accessToken,
      cursor,
    });
  }
  return results;
}

export function getAccounts(db: DB, itemId: string) {
  const results = [];
  for (const [name, nickname, accountId] of db.query(
    `
    SELECT name, nickname, account_id as accountId FROM accounts
    WHERE item_id = ?
    `,
    [itemId]
  ) as Iterable<[string, string, string]>) {
    results.push({
      name,
      nickname,
      accountId,
    });
  }
  return results;
}

interface Resource {
  [key: string]: string | undefined;
}

export function updateAccount(db: DB, accountId: string, resourceIn: Resource) {
  if (accountId !== resourceIn.accountId)
    throw new Error("Account ids don't match.");
  const resource = { ...resourceIn };
  delete resource.accountId;

  const fields = Object.keys(resource);
  const values = Object.values(resource);

  const setClause = fields.map((field) => `${field} = ?`).join(", ");
  const sql = `UPDATE accounts SET ${setClause} WHERE account_id = ?`;

  db.query(sql, [...values, accountId]);

  return 1;
}
