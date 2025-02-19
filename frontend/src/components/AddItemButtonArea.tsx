import { Button } from "./shared/Button";
import { Plus } from "lucide-react";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { useCallback, useState, useEffect, useContext } from "react";
import { RefreshContext } from "../context/RefreshContext";

const BASE_BACKEND_URL = "http://localhost:3002";

export function AddItemButtonArea() {
  const [token, setToken] = useState<string | null>(null);
  const refreshData = useContext(RefreshContext);

  useEffect(() => {
    // TODO move this function to data.ts
    const createLinkToken = async () => {
      const response = await fetch(
        BASE_BACKEND_URL + "/api/create_link_token",
        {
          method: "POST",
        }
      );
      const { link_token } = await response.json();
      setToken(link_token);
    };
    createLinkToken();
  }, []);

  const onSuccess = useCallback<PlaidLinkOnSuccess>(
    async (publicToken, metadata) => {
      try {
        const response = await fetch(
          BASE_BACKEND_URL + "/api/create_access_token",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              publicToken: publicToken,
              metadata: metadata,
            }),
          }
        );
        const data = (await response.json()) as { itemId: string };
        console.log(publicToken, metadata);
        console.log("itemId returned from API: ", data.itemId);
        refreshData();
      } catch (error) {
        console.error(error);
      }
    },
    [refreshData]
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
