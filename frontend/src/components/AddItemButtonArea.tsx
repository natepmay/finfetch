import { Button } from "./Button";

export function AddItemButtonArea({ disabled }: { disabled: boolean }) {
  return (
    <div className="flex justify-center m-5">
      <Button disabled={disabled}>Add a Bank</Button>
    </div>
  );
}
