# Gameplan web app (Next.js)

Night Match visual system. Top 5 leagues · seasons 2023–2025.

```bash
cp .env.example .env.local
npm run dev
```

From repo root:

```bash
npm install
npm run dev
```

Without `API_FOOTBALL_KEY` / `FOOTBALL_DATA_API_TOKEN`, league pages serve mock standings/fixtures.

## Ingest both APIs

```bash
# keys in .env.local
npm run ingest -- --max-jobs=4 --codes=PL,CL,WC
```

Writes JSON under repo `data/raw/{api-football|football-data}/…`.

Optional Python enrichment: see `../../docs/DATA_SOURCES.md`.
