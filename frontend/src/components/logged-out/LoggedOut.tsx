import { useState, useEffect } from "react";

import { getSalt, getItems } from "../../api";
import { deriveKey } from "../../utils/crypto";

import { LoggedOutCard } from "./LoggedOutCard";
import { Login } from "./Login";
import { StartFromScratch } from "./StartFromScratch";

async function doesUserExist() {
  const isItemsEmpty = async (salt: Uint8Array) => {
    const tempKey = await deriveKey("", salt);
    try {
      const items = await getItems(tempKey);
      if (items.length === 0) return true;
      return false;
    } catch {
      return false;
    }
  };

  try {
    const salt = await getSalt();
    const empty = await isItemsEmpty(salt);
    // if there's a salt and decryption with an empty password
    // - errors, there's a user
    // - returns items, there's a user with a empty password
    // - returns an empty array, there's a user with no items, so we treat it as no user
    return !empty;
  } catch {
    // if getSalt() errors, there's no user
    return false;
  }
}

export function LoggedOut() {
  const [userStatus, setUserStatus] = useState(
    "loading" as "loading" | "existent" | "nonexistent"
  );

  useEffect(() => {
    let active = true;
    const getStatus = async () => {
      const isUser = await doesUserExist();
      const nextUserStatus = isUser ? "existent" : "nonexistent";
      if (active) setUserStatus(nextUserStatus);
    };
    getStatus();
    return () => {
      active = false;
    };
  });

  return (
    <div className="flex w-full h-[calc(100vh-68px)] items-center justify-center">
      <LoggedOutCard>
        {userStatus === "existent" && <Login />}
        {userStatus === "nonexistent" && <StartFromScratch />}
      </LoggedOutCard>
    </div>
  );
}
