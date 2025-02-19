import { ChangeEvent, useContext, useState } from "react";
import { ArrowDownToLine } from "lucide-react";

import { Button } from "./shared/Button";
import { Modal } from "./shared/Modal";
import { downloadWrapper } from "../api";
import { RefreshContext } from "../context/RefreshContext";

type ModalState = "hidden" | "error";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  const refreshData = useContext(RefreshContext);
  const [modalState, setModalState] = useState("hidden" as ModalState);
  const [errorMessage, setErrorMessage] = useState(null as string | null);
  const [dateQuery, setDateQuery] = useState("cursor");

  async function handleOnClick() {
    try {
      await downloadWrapper();
      refreshData();
    } catch (err) {
      setErrorMessage((err as Error).message);
      setModalState("error");
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setDateQuery(e.target.value);
  }

  return (
    <div className="flex flex-col items-center m-5">
      <div className="flex gap-2 mb-4">
        <input
          type="radio"
          name="date-query"
          id="query-all"
          value="all"
          checked={dateQuery === "all"}
          onChange={handleChange}
        />
        <label htmlFor="query-all"> Last 2 years</label>
        <input
          type="radio"
          name="date-query"
          id="query-cursor"
          value="cursor"
          checked={dateQuery === "cursor"}
          onChange={handleChange}
        />
        <label htmlFor="query-cursor">Since last download</label>
      </div>
      <Button onClick={handleOnClick} disabled={disabled}>
        <span className="flex items-center gap-2">
          <ArrowDownToLine strokeWidth={1.5} /> Download
        </span>
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
