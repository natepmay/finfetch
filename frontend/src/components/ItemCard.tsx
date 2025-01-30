import { ItemCardAccount } from "./ItemCardAccount";
import { ItemHeader } from "./ItemHeader";

export function ItemCard({ itemName }: { itemName: string }) {
  return (
    <article className="m-5 bg-white rounded-lg w-full sm:w-2/3 lg:w-1/2 p-5 shadow-lg">
      <ItemHeader itemName={itemName}></ItemHeader>
      <ItemCardAccount
        name="Checking 1252"
        nickname="Bankity bank checking"
        lastDownloaded="5 days ago"
      ></ItemCardAccount>
      <ItemCardAccount
        name="Savings 7982"
        nickname="Bankity bank savings"
        lastDownloaded="5 days ago"
      ></ItemCardAccount>
    </article>
  );
}
