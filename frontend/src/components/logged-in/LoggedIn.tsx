import { useContext, useEffect, useState } from "react";

import { ItemCardArea } from "../item/ItemCardArea";
import { AddItemButtonArea } from "./AddItemButtonArea";
import { DownloadButtonArea } from "./DownloadButtonArea";
import { NoItemsMessage } from "./NoItemsMessage";

import { getItems, getAccounts } from "../../api";

import { DataContext, ItemWithAccounts } from "../../context/DataContext";
import { RefreshContext } from "../../context/RefreshContext";
import { CryptoKeyContext } from "../../context/CryptoKeyContext";
import { ResetPw } from "./ResetPw";

export function LoggedIn() {
  const [appData, setAppData] = useState([] as ItemWithAccounts[]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { cryptoKey } = useContext(CryptoKeyContext);

  useEffect(() => {
    let active = true;
    const startFetching = async () => {
      const items = await getItems(cryptoKey!);
      const data: ItemWithAccounts[] = await Promise.all(
        items.map(async (item) => ({
          ...item,
          accounts: await getAccounts(item.itemId),
        }))
      );
      if (active) setAppData(data);
    };
    startFetching();
    return () => {
      active = false;
    };
  }, [refreshTrigger, cryptoKey]);

  function refreshData() {
    setRefreshTrigger((value) => value + 1);
  }

  return (
    <>
      <DataContext.Provider value={appData}>
        <RefreshContext.Provider value={refreshData}>
          <DownloadButtonArea
            disabled={appData.length === 0}
          ></DownloadButtonArea>
          {appData.length > 0 ? (
            <ItemCardArea></ItemCardArea>
          ) : (
            <NoItemsMessage></NoItemsMessage>
          )}

          <AddItemButtonArea></AddItemButtonArea>
          <ResetPw></ResetPw>
        </RefreshContext.Provider>
      </DataContext.Provider>
    </>
  );
}
