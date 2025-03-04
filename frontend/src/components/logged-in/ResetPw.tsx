import { useState, useContext } from "react";

import { Modal } from "../shared/Modal";
import { Button } from "../shared/Button";

import { DataContext } from "../../context/DataContext";
import { wipeData } from "../../api";

export function ResetPw() {
  const [modalState, setModalState] = useState(
    "hidden" as "hidden" | "items" | "noItems"
  );

  const data = useContext(DataContext);

  const hasItems = data && data.length > 0;

  const handleOpenModal = () => {
    const nextModalState = hasItems ? "items" : "noItems";
    setModalState(nextModalState);
  };

  const handleResetPw = () => {
    wipeData();
    window.location.reload();
  };

  return (
    <>
      <p className="text-sm text-center">
        <button className="underline cursor-pointer" onClick={handleOpenModal}>
          Reset Password
        </button>
      </p>

      <Modal
        isOpen={modalState === "items"}
        onClose={() => setModalState("hidden")}
      >
        <>
          <h2 className="font-bold text-lg mb-4">Reset Password</h2>
          <h3 className="mb-4">
            To reset your password, you must first remove all of your banks.
          </h3>
          <Button onClick={() => setModalState("hidden")}>Okay</Button>
        </>
      </Modal>

      <Modal
        isOpen={modalState === "noItems"}
        onClose={() => setModalState("hidden")}
      >
        <>
          <h2 className="font-bold text-lg mb-4">Reset Password</h2>
          <h3 className="mb-4">
            Are you sure you want to reset your password?
          </h3>
          <Button onClick={handleResetPw}>Reset Password</Button>
        </>
      </Modal>
    </>
  );
}
