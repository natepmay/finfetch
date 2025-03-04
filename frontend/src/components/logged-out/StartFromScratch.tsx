import { useContext } from "react";

import { initUser } from "../../api";
import { Button } from "../shared/Button";

import { CryptoKeyContext } from "../../context/CryptoKeyContext";

export function StartFromScratch() {
  const { setCryptoKey } = useContext(CryptoKeyContext);

  const handleNicknameSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const password = formData.get("newPassword") as string;

    const nextCryptoKey = await initUser(password);
    setCryptoKey(nextCryptoKey);
  };
  return (
    <>
      <form className="flex flex-col" onSubmit={handleNicknameSubmit}>
        <h3 className="mb-2">
          <label htmlFor="newPassword">Welcome! Set a password to begin.</label>
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
    </>
  );
}
