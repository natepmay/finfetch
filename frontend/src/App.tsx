import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";

import { Button } from "./components/Button";

import { useRef } from "react";

function App() {
  const haveData = true;
  const itemCardAreRef = useRef<{ refresh: () => Promise<void> } | null>(null);

  return (
    <div className="bg-gray-100 pb-5 h-full">
      <Header></Header>
      <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
      {haveData ? (
        <ItemCardArea ref={itemCardAreRef}></ItemCardArea>
      ) : (
        <NoItemsMessage></NoItemsMessage>
      )}

      <AddItemButtonArea></AddItemButtonArea>
      <Button onClick={async () => await itemCardAreRef.current?.refresh()}>
        Refresh
      </Button>
    </div>
  );
}

export default App;
