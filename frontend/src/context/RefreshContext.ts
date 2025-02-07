import { createContext } from "react";

export const RefreshContext = createContext<() => Promise<void>>(() =>
  Promise.resolve()
);
