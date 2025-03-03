import { useContext, useState } from "react";

import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";

import { authenticate, wipeData } from "../../api";

import { CryptoKeyContext } from "../../context/CryptoKeyContext";

export function Login() {
  const [modalState, setModalState] = useState(
    "hidden" as "hidden" | "wrongPw" | "wiped"
  );

  const [retries, setRetries] = useState(10);

  const { setCryptoKey } = useContext(CryptoKeyContext);

  const handleEnterPw = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("password") as string;

    const result = await authenticate(password);

    if (result) {
      setCryptoKey(result);
    } else {
      if (retries === 1) {
        wipeData();
        setModalState("wiped");
        // don't need to reset retries because they'll need to reload the page to get back to it
        return;
      }
      setRetries((previous) => previous - 1);
      setModalState("wrongPw");
    }
  };

  return (
    <>
      <form onSubmit={handleEnterPw} className="flex flex-col">
        <label htmlFor="password">Enter your password to log in.</label>
        <input
          type="password"
          name="password"
          id="password"
          className="border-1 mb-4 border-gray-400"
        ></input>
        <Button type="submit" onClick={() => {}}>
          Log In
        </Button>
        <p className="text-xs mt-2">
          If you've forgotten your password, 1) delete the file{" "}
          <code>finfetch/backend/db.db</code>, 2) restart the server, 3) refresh
          to set a new password, 4) re-add your banks, 5) check in Plaid to make
          sure you're not being double-charged for any bank connections.{" "}
        </p>
      </form>

      <Modal
        isOpen={modalState === "wrongPw"}
        onClose={() => setModalState("hidden")}
      >
        <h2 className="font-bold text-lg mb-4">Incorrect Password</h2>
        <h3 className="mb-4">
          Try again or start from scratch. Tries remaining: {retries}.
        </h3>
        <Button onClick={() => setModalState("hidden")}>Okay</Button>
      </Modal>

      <Modal
        isOpen={modalState === "wiped"}
        onClose={() => setModalState("hidden")}
      >
        <h2 className="font-bold text-lg mb-4">Too Many Retries</h2>
        <h3 className="mb-4">
          You've entered the wrong password too many times. Your data has been
          reset, and you may now start from scratch.
        </h3>
        <Button onClick={() => setModalState("hidden")}>Okay</Button>
      </Modal>
    </>
  );
}
