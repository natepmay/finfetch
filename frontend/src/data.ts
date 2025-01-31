const BASE_BACKEND_URL = "http://localhost:3002";

interface Item {
  itemId: string;
  name: string;
}

export async function getItems(): Promise<Item[]> {
  const res = await fetch(BASE_BACKEND_URL + "/api/getItems");
  if (!res.ok) {
    throw new Error("Failed to fetch items.");
  }
  const data: Item[] = await res.json();
  return data;
}
