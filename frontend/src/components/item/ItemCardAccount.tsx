import { Modal } from "../shared/Modal";
import { useState } from "react";
import { SquarePen } from "lucide-react";
import { Button } from "../shared/Button";
import { updateAccount } from "../../api";
import { Account } from "../../../../sharedTypes";
import { DistanceSinceDownloaded } from "./DistanceSinceDownloaded";

export function ItemCardAccount({
  account,
  refreshAccounts,
}: {
  account: Account;
  refreshAccounts: () => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleNicknameSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextNickname = formData.get("nickname") as string;
    const nextAccount = {
      ...account,
      nickname: nextNickname,
    };
    await updateAccount(nextAccount);
    setIsModalOpen(false);
    refreshAccounts();
  }

  const { name, nickname, lastDownloaded } = account;

  return (
    <article className="border-b-2 border-b-gray-200 pt-3">
      <header className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{name} </h3>
      </header>
      <div className="grid grid-cols-2 my-3">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Nickname</div>
          <div className="text-lg font-light text-center flex items-center gap-1">
            {nickname}{" "}
            <button
              className="text-blue-600 text-xs underline ml-1 cursor-pointer"
              onClick={() => setIsModalOpen(true)}
            >
              <SquarePen strokeWidth={1.5} size={16} />
              <span className="sr-only">Edit</span>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Last Downloaded</div>
          <div className="text-lg font-light">
            <DistanceSinceDownloaded lastDownloaded={lastDownloaded} />
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form className="flex flex-col" onSubmit={handleNicknameSubmit}>
          <h2 className="font-bold text-lg mb-4">Account Nickname</h2>
          <h3 className="mb-2">
            <label htmlFor="nickname">New nickname for {name}:</label>
          </h3>
          <input
            type="text"
            id="nickname"
            name="nickname"
            defaultValue={nickname}
            className="border-2 border-gray-300 p-2 mb-4"
          ></input>
          <Button type="submit" onClick={() => {}}>
            Submit
          </Button>
        </form>
      </Modal>
    </article>
  );
}
