import { useState } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

export function ItemHeader({ itemName }: { itemName: string }) {
  type ModalState = "closed" | "removeConfirm";
  const [modalState, setModalState] = useState("closed" as ModalState);

  function handleConfirm() {
    console.log("confirmed");
    setModalState("closed");
  }

  return (
    <>
      <header className="border-b-2 border-b-gray-200 pb-2 flex justify-between items-center">
        <h2 className="text-2xl text-blue-700 font-black">{itemName}</h2>
        <a
          className="text-blue-600 text-xs underline cursor-pointer"
          onClick={() => setModalState("removeConfirm")}
        >
          Remove
        </a>
      </header>
      <Modal
        isOpen={modalState === "removeConfirm"}
        onClose={() => setModalState("closed")}
      >
        <h2 className="font-bold text-lg mb-4">Confirm Removal</h2>
        <p className="mb-2">
          Are you sure you want to remove <strong>{itemName}</strong>?
        </p>
        <p className="mb-4">(You can always add it back later.)</p>
        <div className="flex justify-center">
          <Button onClick={handleConfirm}>Remove</Button>
        </div>
      </Modal>
    </>
  );
}
