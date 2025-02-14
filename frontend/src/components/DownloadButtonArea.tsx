import { useContext } from "react";

import { Button } from "./shared/Button";
import { downloadWrapper } from "../api";
import { RefreshContext } from "../context/RefreshContext";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  const refreshData = useContext(RefreshContext);

  async function handleOnClick() {
    try {
      await downloadWrapper();
      refreshData();
    } catch (err) {
      console.log("We errored! ", err);
    }
  }

  return (
    <div className="flex justify-center m-5">
      <Button onClick={handleOnClick} disabled={disabled}>
        Download All
      </Button>
    </div>
  );
}
