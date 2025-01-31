import { ItemCardAccount } from "./ItemCardAccount";
import { ItemHeader } from "./ItemHeader";
import { getAccounts, Account } from "../api";
import { useState, useEffect } from "react";

export function ItemCard({
  itemName,
  itemId,
}: {
  itemName: string;
  itemId: string;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    async function startFetching() {
      setAccounts([]);
      const result = await getAccounts(itemId);
      if (!ignore) {
        setAccounts(result);
      }
    }

    let ignore = false;
    startFetching();
    return () => {
      ignore = true;
    };
  }, [itemId]);

  const accountDisplays = accounts.map((account) => {
    return (
      <ItemCardAccount
        name={account.name}
        nickname={account.nickname}
        lastDownloaded="Who knows"
        key={account.accountId}
      ></ItemCardAccount>
    );
  });

  return (
    <article className="m-5 bg-white rounded-lg w-full sm:w-2/3 lg:w-1/2 p-5 shadow-lg">
      <ItemHeader itemName={itemName}></ItemHeader>
      {accounts.length > 0 && accountDisplays}
    </article>
  );
}
