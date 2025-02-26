import { createContext } from "react";

export const CryptoKeyContext = createContext({
  cryptoKey: null as null | CryptoKey,
  setCryptoKey: (() => {}) as React.Dispatch<
    React.SetStateAction<CryptoKey | null>
  >,
});
