import { ItemCard } from "./ItemCard";
import { getItems } from "../api";
import { Item } from "../../../sharedTypes";
import { useState, useEffect, useImperativeHandle, useCallback } from "react";

type Ref = {
  ref: React.Ref<{
    refresh: () => void;
  }>;
};

export function ItemCardArea({ ref }: Ref) {
  const [items, setItems] = useState<Item[]>([]);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const doRefresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    async function startFetching() {
      console.log("fetching");
      const result = await getItems();
      setItems(result);
    }

    let ignore = false;
    if (!ignore) startFetching();
    return () => {
      ignore = true;
    };
  }, [refreshIndex]);

  useImperativeHandle(ref, () => {
    return {
      refresh: doRefresh,
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
