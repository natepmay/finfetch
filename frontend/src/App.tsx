import { AddItemButtonArea } from "./components/AddItemButtonArea";
import { DownloadButtonArea } from "./components/DownloadButtonArea";
import { Header } from "./components/Header";
import { ItemCardArea } from "./components/ItemCardArea";
import { NoItemsMessage } from "./components/NoItemsMessage";

function App() {
  const haveData = false;
  return (
    <div className="bg-gray-100 pb-5 h-screen">
      <Header></Header>
      <DownloadButtonArea disabled={!haveData}></DownloadButtonArea>
      {haveData ? (
        <ItemCardArea></ItemCardArea>
      ) : (
        <NoItemsMessage></NoItemsMessage>
      )}

      <AddItemButtonArea></AddItemButtonArea>
    </div>
  );
}

export default App;
