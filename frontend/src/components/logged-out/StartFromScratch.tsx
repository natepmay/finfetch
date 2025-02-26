import { initUser } from "../../api";
import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";
import { useState } from "react";

export function StartFromScratch() {
  const [modalState, setModalState] = useState("hidden" as "hidden" | "init");

  const handleNicknameSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("newPassword") as string;

    const cryptoKey = await initUser(password);
  };
  return (
    <>
      <p className="mb-4">Reset all data and set a new password.</p>
      <Button onClick={() => setModalState("init")}>Start from Scratch</Button>
      <Modal
        isOpen={modalState === "init"}
        onClose={() => setModalState("hidden")}
      >
        <form className="flex flex-col" onSubmit={handleNicknameSubmit}>
          <h2 className="font-bold text-lg mb-4">Start from Scratch</h2>
          <h3 className="mb-2">
            <label htmlFor="newPassword">Choose a password:</label>
          </h3>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            className="border-2 border-gray-300 p-2 mb-4"
          ></input>
          <Button type="submit" onClick={() => {}}>
            Set Password
          </Button>
        </form>
      </Modal>
    </>
  );
}
