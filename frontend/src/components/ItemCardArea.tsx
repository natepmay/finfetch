import { ItemCard } from "./ItemCard";
import { getItems, Item } from "../api";
import { useState, useEffect } from "react";

export function ItemCardArea() {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    async function startFetching() {
      setItems([]);
      const result = await getItems();
      if (!ignore) {
        setItems(result);
      }
    }

    let ignore = false;
    startFetching();
    return () => {
      ignore = true;
    };
  }, []);

  const itemCards = items.map((item) => (
    <ItemCard
      itemName={item.name}
      key={item.itemId}
      itemId={item.itemId}
    ></ItemCard>
  ));

  return (
    <div className="flex flex-col justify-center items-center m-5">
      {items.length > 0 && itemCards}
    </div>
  );
}
