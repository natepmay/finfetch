import { ItemCard } from "./ItemCard";
import { getItems } from "../api";
import { Item } from "../../../sharedTypes";
import { useState, useEffect, useImperativeHandle } from "react";

type Ref = {
  ref: React.Ref<{
    refresh: () => Promise<void>;
  }>;
};

export function ItemCardArea({ ref }: Ref) {
  const [items, setItems] = useState<Item[]>([]);

  async function startFetching() {
    console.log("fetching");
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
    <ItemCard item={item} key={item.itemId}></ItemCard>
  ));

  return (
    <div className="flex flex-col justify-center items-center m-5">
      {items.length > 0 && itemCards}
    </div>
  );
}
