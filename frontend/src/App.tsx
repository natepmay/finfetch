import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/item/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";
import { getAccounts, getItems } from "./api";

import { useEffect, useState } from "react";
import { RefreshContext } from "./context/RefreshContext";
import { DataContext, ItemWithAccounts } from "./context/DataContext";

function App() {
  const [appData, setAppData] = useState([] as ItemWithAccounts[]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let active = true;
    const startFetching = async () => {
      const items = await getItems();
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
  }, [refreshTrigger]);

  function refreshData() {
    setRefreshTrigger((value) => value + 1);
  }

  return (
    <div className="bg-gray-100 pb-5 min-h-screen">
      <DataContext.Provider value={appData}>
        <RefreshContext.Provider value={refreshData}>
          <Header></Header>
          <DownloadButtonArea
            disabled={appData.length === 0}
          ></DownloadButtonArea>
          {appData.length > 0 ? (
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
