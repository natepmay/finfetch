import { ItemCard } from "./ItemCard";
import { getItems } from "../data";

const items = await getItems();
console.log(items);

export function ItemCardArea() {
  return (
    <div className="flex flex-col justify-center items-center m-5">
      <ItemCard itemName="First Bankity Bank"></ItemCard>
    </div>
  );
}
