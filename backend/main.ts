import express from "npm:express";
import { Configuration, PlaidApi, PlaidEnvironments } from "npm:plaid";
const app = express();
const port = 3002;

const PLAID_CLIENT_ID = "678c42d1e54ee60025166d12";
const PLAID_SECRET = "5446e8b0ba7593997ef974bf4c7f08";
const ACCESS_TOKEN = "access-sandbox-e13f4d99-6f6d-482f-967d-887d853240dd";

const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
      "PLAID-SECRET": PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});

const client = new PlaidApi(configuration);

app.get("/", (_: express.Request, res: express.Response) => {
  res.send({ jsony: "moree stuff" });
});

app.post("/api/sync", async (_: express.Request, res: express.Response) => {
  const request = {
    access_token: ACCESS_TOKEN,
    cursor: undefined,
  };
  const response = await client.transactionsSync(request);
  const data = response.data;
  res.json(data);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
