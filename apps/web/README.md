# Gameplan web app (Next.js)

Night Match visual · top 5 + UEFA + World Cup.

## Setup (Mac)

```bash
cd ~/Gameplan
git pull
cd apps/web
cp -n .env.example .env.local   # add API keys
cd ../..
npm install
cd apps/web
npm run dev
```

Open http://localhost:3000

Without API keys, pages use mock data.

## Ingest

```bash
# keys in apps/web/.env.local
npm run ingest -- --max-jobs=4 --codes=PL,CL,WC

# Full pipeline from repo root (APIs + soccerdata + StatsBomb):
cd ../.. && npm run ingest:all
```

## Troubleshooting: `lightningcss.darwin-arm64.node`

Tailwind v4 needs a **Mac-native** binary. If you see that error, reinstall on your Mac (don’t reuse Linux/`node_modules`):

```bash
cd ~/Gameplan
# stop npm run dev (Ctrl+C)
rm -rf node_modules apps/web/node_modules apps/web/.next
npm install
cd apps/web
npm run dev
```

If it still fails:

```bash
cd ~/Gameplan/apps/web
npm install lightningcss
npm run dev
```
