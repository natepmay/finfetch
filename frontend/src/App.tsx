import { useState } from "react";

import { Header } from "./components/Header";
import { LoggedOut } from "./components/logged-out/LoggedOut";
import { LoggedIn } from "./components/logged-in/LoggedIn";

import { CryptoKeyContext } from "./context/CryptoKeyContext";

function App() {
  const [cryptoKey, setCryptoKey] = useState(null as CryptoKey | null);

  return (
    <div className="bg-gray-100 pb-5 min-h-screen">
      <CryptoKeyContext.Provider value={{ cryptoKey, setCryptoKey }}>
        <Header></Header>
        <main>{cryptoKey ? <LoggedIn /> : <LoggedOut />}</main>
      </CryptoKeyContext.Provider>
    </div>
  );
}

export default App;
