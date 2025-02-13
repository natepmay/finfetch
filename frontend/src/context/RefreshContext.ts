import { createContext } from "react";

export const RefreshContext = createContext<() => void>(() =>
  Promise.resolve()
);
