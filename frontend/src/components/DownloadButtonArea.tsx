import { useContext, useState } from "react";

import { Button } from "./shared/Button";
import { Modal } from "./shared/Modal";
import { downloadWrapper } from "../api";
import { RefreshContext } from "../context/RefreshContext";

type ModalState = "hidden" | "error";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  const refreshData = useContext(RefreshContext);
  const [modalState, setModalState] = useState("hidden" as ModalState);
  const [errorMessage, setErrorMessage] = useState(null as string | null);

  async function handleOnClick() {
    try {
      await downloadWrapper();
      refreshData();
    } catch (err) {
      setErrorMessage((err as Error).message);
      setModalState("error");
    }
  }

  return (
    <div className="flex justify-center m-5">
      <Button onClick={handleOnClick} disabled={disabled}>
        Download All
      </Button>
      <Modal
        isOpen={modalState === "error"}
        onClose={() => setModalState("hidden")}
      >
        <div className="flex flex-col max-w-md">
          <h2 className="font-bold text-lg mb-4">Error</h2>
          <div className="mb-4">{errorMessage}</div>
          <Button type="submit" onClick={() => setModalState("hidden")}>
            Okay
          </Button>
        </div>
      </Modal>
    </div>
  );
}
