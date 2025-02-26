import { LoggedOutCard } from "./LoggedOutCard";
import { Login } from "./Login";
import { StartFromScratch } from "./StartFromScratch";

export function LoggedOut() {
  return (
    <div className="flex justify-center">
      <div className="flex w-full h-[calc(100vh-68px)] items-center justify-center">
        <LoggedOutCard>
          <Login />
        </LoggedOutCard>
        <LoggedOutCard>
          <StartFromScratch />
        </LoggedOutCard>
      </div>
    </div>
  );
}
