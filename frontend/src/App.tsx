import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";

import { useRef } from "react";
import { RefreshContext } from "./context/RefreshContext";

function App() {
  const haveData = true;
  const itemCardAreaRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  async function refreshItems() {
    console.log("inside refreshItems", itemCardAreaRef.current);
    await itemCardAreaRef.current?.refresh();
  }

  return (
    <div className="bg-gray-100 pb-5 h-full">
      <RefreshContext.Provider value={refreshItems}>
        <Header></Header>
        <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
        {haveData ? (
          <ItemCardArea ref={itemCardAreaRef}></ItemCardArea>
        ) : (
          <NoItemsMessage></NoItemsMessage>
        )}

        <AddItemButtonArea></AddItemButtonArea>
      </RefreshContext.Provider>
    </div>
  );
}

export default App;
