import { ItemCardAccount } from "./ItemCardAccount";
import { ItemHeader } from "./ItemHeader";
import { getAccounts, Account } from "../api";
import { useState, useEffect, useCallback } from "react";

export function ItemCard({
  itemName,
  itemId,
}: {
  itemName: string;
  itemId: string;
}) {
  const [accounts, setAccounts] = useState<Account[]>([]);

  const startFetching = useCallback(async () => {
    const result = await getAccounts(itemId);
    setAccounts(result);
  }, [itemId]);

  useEffect(() => {
    let ignore = false;
    if (!ignore) startFetching();
    return () => {
      ignore = true;
    };
  }, [startFetching]);

  const accountDisplays = accounts.map((account) => {
    return (
      <ItemCardAccount
        account={account}
        key={account.accountId}
        refreshAccounts={startFetching}
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
