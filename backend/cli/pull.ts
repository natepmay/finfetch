import { parseArgs } from "jsr:@std/cli/parse-args";
import { join } from "jsr:@std/path";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
} from "npm:plaid";
import "jsr:@std/dotenv/load";

import { initDb, getItems } from "../db.ts";
import { runTransactionSync } from "../services/syncService.ts";
import { importKey } from "../utils/crypto.ts";

function usage(): never {
  console.error(`Usage: deno task pull -- --output-dir <dir> --range <2y|new> [--key <base64>]

  --output-dir  Parent directory; a timestamped subfolder is created with CSV exports.
  --range       2y = full resync (last ~2 years, same as web "Last 2 years").
                new = changes since last download (same as web "Since last download").
  --key         Optional. Crypto key string; defaults to FINFETCH_CRYPTO_KEY_STRING env.`);
  Deno.exit(1);
}

const PLAID_PRODUCTS = ["transactions"] as Products[];

function createPlaidClient(): PlaidApi {
  const PLAID_CLIENT_ID = Deno.env.get("PLAID_CLIENT_ID");
  const PLAID_SECRET = Deno.env.get("PLAID_SECRET");
  const PLAID_ENV = Deno.env.get("PLAID_ENV");

  const configuration = new Configuration({
    basePath: PlaidEnvironments[PLAID_ENV!],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": PLAID_CLIENT_ID,
        "PLAID-SECRET": PLAID_SECRET,
        "Plaid-Version": "2020-09-14",
      },
    },
  });

  return new PlaidApi(configuration);
}

function exportFolderName(): string {
  const stamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
  return `finfetch-${stamp}`;
}

const args = parseArgs(Deno.args, {
  string: ["output-dir", "range", "key"],
  alias: { o: "output-dir", r: "range", k: "key" },
});

const outputDir = args["output-dir"];
const range = args.range;
const keyArg = args.key;

if (!outputDir || !range) {
  usage();
}

if (range !== "2y" && range !== "new") {
  console.error(`Invalid --range "${range}". Use 2y or new.`);
  Deno.exit(1);
}

const useCursor = range === "new";
const cryptoKeyString = keyArg ?? Deno.env.get("FINFETCH_CRYPTO_KEY_STRING");
if (!cryptoKeyString) {
  console.error(
    "Missing crypto key: set FINFETCH_CRYPTO_KEY_STRING or pass --key."
  );
  Deno.exit(1);
}

initDb();

const cryptoKey = await importKey(cryptoKeyString);
const items = await getItems(cryptoKey);

if (items.length === 0) {
  console.error("No linked items in the database.");
  Deno.exit(1);
}

const client = createPlaidClient();
const { csvStrings, txnCount } = await runTransactionSync(
  client,
  items,
  useCursor
);

const runDir = join(outputDir, exportFolderName());
await Deno.mkdir(runDir, { recursive: true });

for (const [category, csv] of Object.entries(csvStrings)) {
  if (csv) {
    await Deno.writeTextFile(join(runDir, `${category}.csv`), csv);
  }
}

console.log(`Wrote export to ${runDir}`);
console.log(
  `Transactions — added: ${txnCount.added}, modified: ${txnCount.modified}, removed: ${txnCount.removed}`
);
