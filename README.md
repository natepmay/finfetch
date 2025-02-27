# Finfetch

_Download all of your bank and credit card transactions to CSVs in a simple web interface, run locally._

Finfetch gives you access to the same transaction data that is used internally by many personal finance apps, including a unified auto-categorization system that works across institutions and accounts. Unlike those apps, though, Finfetch runs locally on your computer, allowing you to process that data in any way you'd like. This is particularly useful for those who use Plain Text Accounting software (Ledger, Beancount, Hledger, etc.), or anyone who prefers to track their income and expenses in spreadsheets.

## Transaction Data Format

Each time you download your transactions you have the option to download all available data or only the data that's new since your last download. You'll receive a Zip file containing separate CSVs for added, removed, and modified transactions.

Each added transaction contains up to 42 data fields, reliably including

- date
- amount
- account
- transaction ID (referenced when transactions are deleted)
- merchant name
- broad category of transaction (e.g. "FOOD_AND_DRINK")
- narrow category of transaction (e.g. "FOOD_AND_DRINK_COFFEE")
- confidence level of categorization (e.g. "VERY_HIGH")

## General Usage

1. In your terminal, start the server by running

```bash
cd finfetch/backend
deno run --allow-all main.ts
```

2. Point your browser to [http://localhost:3002]().
1. Login and download your data with one click.
1. Stop the server (close the terminal window or use the key command for your system).

## Setup (First Time Only)

Finfetch is powered by Plaid, a service that connects with banks to retrieve your data. You'll need your own Plaid developer account to use it. **Please note that use of Plaid's API for real-world data requires payment after a limited number of free uses.** See below for pricing.

(TODO: look into availability outside of US and Canada.)

1. Follow the flow on [Plaid's Signup page](https://dashboard.plaid.com/signup) to make an account as a developer. You'll need to give them some information about your app and how you plan to use the API.
1. Within the Plaid dashboard, apply for production access. This will take a few days, but you can use Finfetch in Sandbox mode in the meantime.
1. Clone or download this repo onto your computer.
1. If you don't have Deno installed, download and install it by running

```bash
curl -fsSL https://deno.land/install.sh | sh
```

5. Create a file named `.env` within the `backend` directory of Finfetch, and add the following:

```
PLAID_CLIENT_ID=
PLAID_ENV=
PLAID_SECRET=
```

6. Find your API keys in the [Plaid Dashboard](https://dashboard.plaid.com/developers/keys) under Developer > Keys.
1. In the `.env` file, add the values from your dashboard, with no quotation marks. Keeping in mind the following:
   1. Possible values for `PLAID_ENV` are `sandbox` or `production`
   1. Make sure you choose the corresponding secret (sandbox or production) from your dashboard.
1. Start the Finfetch server by running

```bash
cd backend
deno run --allow-all main.ts
```

9. Open a browser and navigate to [http://localhost:3002/]().

Within the app, you can now click "Start from Scratch" and follow the prompts to create a password, add your bank accounts, and download your data (if you've been approved for production).

Be sure shut down the server at the end of your session (you can do this by closing the terminal window).

## Pricing

While Finfetch is free and open source, data is provided through Plaid's API which is a paid product. At the time of writing (February 2025), their pricing for production access in the US is $0.30 per month per connected account, after 200 free API calls. When you sign up for production access you'll see the latest pricing and enter payment information.

## Security

Finfetch keeps a small database on your machine with only enough information to 1) authenticate a single user, 2) display your bank names and account "masks" (last four digits of account numbers), 3) request transaction data from Plaid. No transaction data is kept within this database--that lives in the CSVs that you download.

To prevent an attacker with access to your hard drive from gaining API privileges to your accounts, your Plaid access keys are stored in an encrypted form. If you forget your password you'll simply need to reconnect your banks (the app will walk you through this).

Since Finfetch runs a local server that is only accessible to your machine, others on your network will not be able to access your running process. I've done my best to mitigate the risks of XSS attacks but will be interested to hear from those more well-versed in cybersecurity on whether their are additional measures that can be taken.

## Development

To run in development mode you'll need 1) Node/NPM installed, and 2) to make the following changes:

1. Within `backend/.env`, change `PLAID_ENV` to `sandbox` and replace the `PLAID_SECRET` with your sandbox secret from your Plaid dashboard.
1. Within `backend/main.ts` uncomment the line `app.use(cors())`. This will allow your frontend and backend to run on different ports and still communicate (not recommended in production mode for security reasons).
1. Start the backend server:

```bash
cd backend
deno run dev
```

4. Install Node modules and start the frontend server:

```
cd frontend
npm install
npm run dev
```

5. This will run the development server in Vite, which will tell you which port it's running on.

(Plaid info)

Set Plaid Link Use Case:
https://dashboard.plaid.com/link/data-transparency-v5
