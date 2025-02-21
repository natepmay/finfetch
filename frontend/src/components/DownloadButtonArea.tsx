import { ChangeEvent, useContext, useState } from "react";
import { ArrowDownToLine } from "lucide-react";

import { Button } from "./shared/Button";
import { Modal } from "./shared/Modal";
import { downloadWrapper, TxnCount } from "../api";
import { RefreshContext } from "../context/RefreshContext";

type ModalState = "hidden" | "error" | "success";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  const refreshData = useContext(RefreshContext);
  const [modalState, setModalState] = useState("hidden" as ModalState);
  const [errorMessage, setErrorMessage] = useState(null as string | null);
  const [dateQuery, setDateQuery] = useState("cursor" as "cursor" | "all");
  const [txnCount, setTxnCount] = useState({
    added: 0,
    removed: 0,
    modified: 0,
  } as TxnCount);

  async function handleOnClick() {
    try {
      const txnsRaw = await downloadWrapper(dateQuery);
      setTxnCount(txnsRaw);
      refreshData();
      setModalState("success");
    } catch (err) {
      setErrorMessage((err as Error).message);
      setModalState("error");
    }
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setDateQuery(e.target.value as "cursor" | "all");
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

      <Modal
        isOpen={modalState === "success"}
        onClose={() => setModalState("hidden")}
      >
        <div className="flex flex-col max-w-md">
          <h2 className="font-bold text-lg mb-4">Success</h2>
          <div className="mb-4">
            {Object.values(txnCount).every((num) => num === 0) ? (
              <>No new transactions.</>
            ) : (
              <>
                Transactions added: {txnCount.added}, removed:{" "}
                {txnCount.removed}, modified: {txnCount.modified}.
              </>
            )}
          </div>
          <Button type="submit" onClick={() => setModalState("hidden")}>
            Okay
          </Button>
        </div>
      </Modal>
    </div>
  );
}
