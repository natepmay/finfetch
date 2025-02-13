import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";
import { getAccounts, getItems } from "./api";

import { useEffect, useState } from "react";
import { RefreshContext } from "./context/RefreshContext";
import { DataContext, ItemWithAccounts } from "./context/DataContext";

function App() {
  const haveData = true;
  const [appData, setAppData] = useState([] as ItemWithAccounts[]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const startFetching = async () => {
      const items = await getItems();
      const data: ItemWithAccounts[] = await Promise.all(
        items.map(async (item) => ({
          ...item,
          accounts: await getAccounts(item.itemId),
        }))
      );
      setAppData(data);
    };
    // TODO confirm/understand these race conditions
    let ignore = false;
    if (ignore) return;
    startFetching();
    ignore = true;
  }, [refreshTrigger]);

  function refreshData() {
    console.log("refreshing");
    setRefreshTrigger((value) => value + 1);
    console.log("refresh trigger value: ", refreshTrigger);
  }

  return (
    <div className="bg-gray-100 pb-5 h-full">
      <DataContext.Provider value={appData}>
        <RefreshContext.Provider value={refreshData}>
          <Header></Header>
          <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
          {haveData ? (
            <ItemCardArea></ItemCardArea>
          ) : (
            <NoItemsMessage></NoItemsMessage>
          )}

          <AddItemButtonArea></AddItemButtonArea>
        </RefreshContext.Provider>
      </DataContext.Provider>
    </div>
  );
}

export default App;
