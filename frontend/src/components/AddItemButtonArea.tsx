import { Button } from "./Button";
import { usePlaidLink, PlaidLinkOnSuccess } from "react-plaid-link";
import { useCallback, useState, useEffect } from "react";

const BASE_BACKEND_URL = "http://localhost:3002";

export function AddItemButtonArea({ onAddData }: { onAddData: () => void }) {
  const [token, setToken] = useState<string | null>(null);
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
        onAddData();
      } catch (error) {
        console.error(error);
      }
    },
    [onAddData]
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
        Add a Bank
      </Button>
    </div>
  );
}
