import { useState, useEffect } from "react";

import { getSalt } from "../../api";

import { LoggedOutCard } from "./LoggedOutCard";
import { Login } from "./Login";
import { StartFromScratch } from "./StartFromScratch";

export function LoggedOut() {
  const [userStatus, setUserStatus] = useState(
    "loading" as "loading" | "existent" | "nonexistent"
  );

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
