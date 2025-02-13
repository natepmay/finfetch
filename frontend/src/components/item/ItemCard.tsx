import { ItemCardAccount } from "./ItemCardAccount";
import { ItemHeader } from "./ItemHeader";
import { ItemWithAccounts } from "../../context/DataContext";
import { RefreshContext } from "../../context/RefreshContext";
import { useContext } from "react";

export function ItemCard({ item }: { item: ItemWithAccounts }) {
  const { accounts } = item;

  const refreshData = useContext(RefreshContext);

  const accountDisplays = accounts.map((account) => {
    return (
      <ItemCardAccount
        account={account}
        key={account.accountId}
        refreshAccounts={refreshData}
      ></ItemCardAccount>
    );
  });

  return (
    <article className="m-5 bg-white rounded-lg w-full sm:w-2/3 lg:w-1/2 p-5 shadow-lg">
      <ItemHeader item={item}></ItemHeader>
      {accounts.length > 0 && accountDisplays}
    </article>
  );
}
