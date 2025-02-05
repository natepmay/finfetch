import { Button } from "./Button";
import { downloadWrapper } from "../api";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex justify-center m-5">
      <Button onClick={downloadWrapper} disabled={disabled}>
        Download All
      </Button>
    </div>
  );
}
