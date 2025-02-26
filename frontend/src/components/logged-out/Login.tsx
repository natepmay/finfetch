import { useContext, useEffect, useState } from "react";

import { Button } from "../shared/Button";
import { Modal } from "../shared/Modal";

import { authenticate, getSalt, wipeData } from "../../api";

import { CryptoKeyContext } from "../../context/CryptoKeyContext";

export function Login() {
  const [modalState, setModalState] = useState(
    "hidden" as "hidden" | "wrongPw" | "wiped"
  );
  const [userStatus, setUserStatus] = useState(
    "loading" as "loading" | "existent" | "nonexistent"
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

  useEffect(() => {
    let active = true;
    const getStatus = async () => {
      try {
        await getSalt();
        if (active) setUserStatus("existent");
      } catch {
        if (active) setUserStatus("nonexistent");
      }
    };
    getStatus();
    return () => {
      active = false;
    };
  }, [modalState]);

  const userExists = (
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
    </form>
  );

  const userDoesntExist = (
    <>
      <h3 className="text-gray-500">
        No data found. Click "Start from Scratch" to get started.
      </h3>
    </>
  );

  return (
    <>
      {userStatus === "existent" && userExists}

      {userStatus === "nonexistent" && userDoesntExist}

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
