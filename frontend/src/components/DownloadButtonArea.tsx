import { Button } from "./Button";

export function DownloadButtonArea({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex justify-center m-5">
      <Button onClick={() => {}} disabled={disabled}>
        Download All
      </Button>
    </div>
  );
}
