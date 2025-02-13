# Finfetch

Download all your financial transactions simply.

The backend uses the Deno runtime.

## To Run the Backend in Dev Mode

```bash
cd backend
deno run dev
```

Note: `deno run dev` includes the `--allow-all` flag. If `--allow-all` makes you nervous and you'd like to see which permissions Deno requires, you can run `deno run --watch main.ts` and Deno will walk you through the permissions one-by-one.
