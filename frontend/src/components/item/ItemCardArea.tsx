import { ItemCard } from "./ItemCard";
import { useContext } from "react";
import { DataContext } from "../../context/DataContext";

export function ItemCardArea() {
  const items = useContext(DataContext);

  const itemCards = items.map((item) => (
    <ItemCard item={item} key={item.itemId}></ItemCard>
  ));

  return (
    <div className="flex flex-col justify-center items-center m-5">
      {items.length > 0 && itemCards}
    </div>
  );
}
