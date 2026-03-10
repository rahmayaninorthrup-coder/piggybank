## PiggyBank

PiggyBank is a mobile-first expense journal built with Vite, React, Tailwind, and a browser-local data layer:

- IndexedDB via Dexie stores users, categories, and expenses
- `localStorage` stores the lightweight session state
- GitHub Pages hosts the app as a static site

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to `main` and the workflow in `.github/workflows/deploy.yml` will publish the Vite `dist/` output to GitHub Pages.

In the GitHub repository settings, set Pages to use GitHub Actions if it is not already enabled.

For a direct branch publish, run:

```bash
npm run deploy:gh-pages
```

This rebuilds the app and force-pushes a clean static artifact to the orphan `gh-pages` branch.

## Notes

This app is intentionally local-first. Data lives in the browser, so each device keeps its own ledger unless you later add sync.
