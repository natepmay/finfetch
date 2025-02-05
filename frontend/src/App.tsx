import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";

import { useState } from "react";

function App() {
  // Link sets this to true when it returns successfully. This triggers a re-rending of the cards.
  const [hasNewData, setHasNewData] = useState(true);

  const haveData = true;
  return (
    <div className="bg-gray-100 pb-5 h-full">
      <Header></Header>
      <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
      {haveData ? (
        <ItemCardArea
          hasNewData={hasNewData}
          onUpdateData={() => setHasNewData(false)}
        ></ItemCardArea>
      ) : (
        <NoItemsMessage></NoItemsMessage>
      )}

      <AddItemButtonArea
        onAddData={() => setHasNewData(true)}
      ></AddItemButtonArea>
    </div>
  );
}

export default App;
