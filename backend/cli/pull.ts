import { parseArgs } from "jsr:@std/cli/parse-args";
import { readAll } from "jsr:@std/io/read-all";
import { join } from "jsr:@std/path";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
} from "npm:plaid";
import "jsr:@std/dotenv/load";

import { initDb, getItems, getSalt } from "../db.ts";
import { runTransactionSync } from "../services/syncService.ts";
import { deriveKey } from "../utils/crypto.ts";

function usage(): never {
  console.error(`Usage: finfetch pull --output-dir <dir> --range <2y|new>

  --output-dir     Parent directory; a timestamped subfolder is created with CSV exports.
  --range          2y = full resync (last ~2 years). new = changes since last download.
  
Password is read from stdin (first line). Use the repo's finfetch wrapper:
  - Interactive: ./finfetch pull ...
  - Piped:       printf '%s\n' "$PW" | finfetch pull ...`);
  Deno.exit(1);
}

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

async function readPasswordStdin(): Promise<string> {
  const raw = await readAll(Deno.stdin);
  const text = new TextDecoder().decode(raw);
  const line = text.split(/\r?\n/)[0] ?? "";
  return line;
}

const args = parseArgs(Deno.args, {
  string: ["output-dir", "range"],
  alias: { o: "output-dir", r: "range" },
});

const outputDir = args["output-dir"];
const range = args.range;

if (!outputDir || !range) {
  usage();
}

if (range !== "2y" && range !== "new") {
  console.error(`Invalid --range "${range}". Use 2y or new.`);
  Deno.exit(1);
}

const useCursor = range === "new";

if (Deno.stdin.isTerminal()) {
  console.error(
    "Password must be provided via stdin. Use ./finfetch pull (interactive) or pipe: printf '%s\\n' \"$PW\" | finfetch pull ...",
  );
  Deno.exit(1);
}

const password = await readPasswordStdin();

initDb();

let salt: Uint8Array;
try {
  salt = getSalt(1);
} catch {
  console.error(
    "No user salt in the database. Create your account in the web app first.",
  );
  Deno.exit(1);
}

const cryptoKey = await deriveKey(password, salt);
const items = await getItems(cryptoKey);

if (items.length === 0) {
  console.error("No linked items in the database.");
  Deno.exit(1);
}

const client = createPlaidClient();
const { csvStrings, txnCount } = await runTransactionSync(
  client,
  items,
  useCursor,
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
  `Transactions — added: ${txnCount.added}, modified: ${txnCount.modified}, removed: ${txnCount.removed}`,
);
