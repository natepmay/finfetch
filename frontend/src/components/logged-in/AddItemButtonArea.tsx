import { Button } from "../shared/Button";
import { Plus } from "lucide-react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { useCallback, useState, useEffect, useContext } from "react";
import { RefreshContext } from "../../context/RefreshContext";
import { createAccessToken, createLinkToken } from "../../api";
import { CryptoKeyContext } from "../../context/CryptoKeyContext";

export function AddItemButtonArea() {
  const [token, setToken] = useState<string | null>(null);
  const refreshData = useContext(RefreshContext);
  const { cryptoKey } = useContext(CryptoKeyContext);

  useEffect(() => {
    const tokenWrapper = async () => {
      const linkToken = await createLinkToken();
      setToken(linkToken);
    };
    tokenWrapper();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      const itemId = await createAccessToken(publicToken, metadata, cryptoKey!);
      console.log("itemId returned from API: ", itemId);
      refreshData();
    },
    [refreshData, cryptoKey]
  );

  const { open, ready } = usePlaidLink({
    token,
    onSuccess,
    // onEvent
    // onExit
  });

  return (
    <div className="flex justify-center m-5">
      <Button disabled={!ready} onClick={() => open()}>
        <span className="flex items-center gap-2">
          <Plus strokeWidth={1.5} />
          Add a Bank
        </span>
      </Button>
    </div>
  );
}
