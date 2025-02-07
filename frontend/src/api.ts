import downloadAndSaveFile from "./download";

const BASE_BACKEND_URL = "http://localhost:3002";

export interface Item {
  itemId: string;
  name: string;
}

export interface Account {
  accountId: string;
  name: string;
  nickname: string;
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(BASE_BACKEND_URL + "/api/getItems");
  if (!res.ok) {
    throw new Error("Failed to fetch items.");
  }
  const data: Item[] = await res.json();
  return data;
}

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

export async function downloadWrapper(): Promise<void> {
  return await downloadAndSaveFile({
    url: `${BASE_BACKEND_URL}/api/sync`,
    defaultFileName: "default-download.csv",
  });
}

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

export async function deleteItem(itemId: string) {
  try {
    await fetch(`${BASE_BACKEND_URL}/api/items/${itemId}`, {
      method: "DELETE",
    });
  } catch (error) {
    throw new Error(String(error));
  }
}
