import { ItemCard } from "./ItemCard";
import { getItems, Item } from "../api";
import { useState, useEffect, useImperativeHandle } from "react";

type Ref = {
  ref: React.Ref<{
    refresh: () => Promise<void>;
  }>;
};

export function ItemCardArea({ ref }: Ref) {
  const [items, setItems] = useState<Item[]>([]);

  async function startFetching() {
    const result = await getItems();
    setItems(result);
  }

  useEffect(() => {
    let ignore = false;
    if (!ignore) startFetching();
    return () => {
      ignore = true;
    };
  }, []);

  useImperativeHandle(ref, () => {
    return {
      refresh: startFetching,
    };
  });

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
