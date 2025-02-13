import { Button } from "./Button";
import { downloadWrapper } from "../api";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  async function handleOnClick() {
    await downloadWrapper();
  }

  return (
    <div className="flex justify-center m-5">
      <Button onClick={handleOnClick} disabled={disabled}>
        Download All
      </Button>
    </div>
  );
}
