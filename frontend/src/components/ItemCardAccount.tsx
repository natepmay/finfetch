import { Modal } from "./Modal";
import { useState } from "react";
import { Button } from "./Button";

interface Props {
  name: string;
  nickname: string;
  lastDownloaded: string;
}

export function ItemCardAccount({ name, nickname, lastDownloaded }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <article className="border-b-2 border-b-gray-200 pt-3">
      <header className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{name} </h3>
        <a className="text-blue-600 text-xs underline">Remove</a>
      </header>
      <div className="grid grid-cols-2 my-3">
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Nickname</div>
          <div className="text-lg font-light text-center">
            {nickname}{" "}
            <a
              className="text-blue-600 text-xs underline ml-1"
              onClick={() => setIsModalOpen(true)}
            >
              Edit
            </a>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-sm font-bold">Last Downloaded</div>
          <div className="text-lg font-light">{lastDownloaded}</div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form className="flex flex-col">
          <h2 className="font-bold text-lg mb-4">Account Nickname</h2>
          <h3 className="mb-2">
            <label htmlFor="nickname">New nickname for {name}:</label>
          </h3>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={nickname}
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
