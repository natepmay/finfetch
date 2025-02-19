import { useState, useContext } from "react";
import { Trash2 } from "lucide-react";
import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";
import { deleteItem } from "../../api";
import { Item } from "../../../../sharedTypes";
import { RefreshContext } from "../../context/RefreshContext";

export function ItemHeader({ item }: { item: Item }) {
  type ModalState = "closed" | "removeConfirm";

  const [modalState, setModalState] = useState("closed" as ModalState);
  const refreshData = useContext(RefreshContext);

  async function handleConfirm() {
    await deleteItem(item.itemId);
    refreshData();
    setModalState("closed");
  }

  return (
    <>
      <header className="border-b-2 border-b-gray-200 pb-2 flex justify-between items-center">
        <h2 className="text-2xl text-blue-700 font-black">{item.name}</h2>
        <button
          className="text-blue-600 text-xs underline cursor-pointer"
          onClick={() => setModalState("removeConfirm")}
        >
          <Trash2 strokeWidth={1.5} size={20} />
          <span className="sr-only">Remove</span>
        </button>
      </header>
      <Modal
        isOpen={modalState === "removeConfirm"}
        onClose={() => setModalState("closed")}
      >
        <h2 className="font-bold text-lg mb-4">Confirm Removal</h2>
        <p className="mb-2">
          Are you sure you want to remove <strong>{item.name}</strong>?
        </p>
        <p className="mb-4">(You can always add it back later.)</p>
        <div className="flex justify-center">
          <Button onClick={handleConfirm}>Remove</Button>
        </div>
      </Modal>
    </>
  );
}
