import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";

import { Button } from "./components/Button";

import { useRef } from "react";

function App() {
  const haveData = true;
  const itemCardAreaRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  async function refreshItems() {
    console.log("inside refreshItems", itemCardAreaRef.current);
    await itemCardAreaRef.current?.refresh();
  }

  return (
    <div className="bg-gray-100 pb-5 h-full">
      <Header></Header>
      <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
      {haveData ? (
        <ItemCardArea ref={itemCardAreaRef}></ItemCardArea>
      ) : (
        <NoItemsMessage></NoItemsMessage>
      )}

      <AddItemButtonArea refreshItems={refreshItems}></AddItemButtonArea>
      <Button
        onClick={async () => {
          console.log("clicked");
          console.log(itemCardAreaRef.current);
          await refreshItems();
        }}
      >
        Refresh
      </Button>
    </div>
  );
}

export default App;
