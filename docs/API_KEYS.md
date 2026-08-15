# How to get API keys for Gameplan

You add these as **environment secrets** (Cursor Cloud Agent secrets and/or Vercel project env). Never commit them to git.

After you create each token, paste it into the Cursor agent secrets prompt (or your local `.env.local`).

---

## 1. football-data.org — `FOOTBALL_DATA_API_TOKEN` (recommended first)

**What it’s for:** Fixtures, results, standings for the top 5 leagues.

### Steps

1. Open **[https://www.football-data.org/client/register](https://www.football-data.org/client/register)**
2. Create a free account (email + password)
3. Accept terms → you’ll get a free-tier API token (often emailed; also visible after login)
4. If you lose it: **[Forgot token](https://www.football-data.org/client/forgotToken)** / sign in at **[login](https://www.football-data.org/client/login)**
5. Copy the token → save as `FOOTBALL_DATA_API_TOKEN`

### Free tier notes (important)

- ~**10 requests/minute**
- Top competitions including PL, La Liga, Bundesliga, Serie A, Ligue 1
- Scores/schedules are typically **delayed** (fine for dashboards, not true live)
- **Historical depth on free may be current-season only** — paid “historical” add-on unlocks older seasons

### How we use it

Every request needs header:

```http
X-Auth-Token: YOUR_TOKEN
```

Base URL: `https://api.football-data.org/v4`

Docs: [https://www.football-data.org/documentation/api](https://www.football-data.org/documentation/api)

---

## 2. API-Football — `API_FOOTBALL_KEY` (needed for last 3 seasons + richer stats)

**What it’s for:** Multi-season fixtures, player stats, live-ish data, broader endpoints. **This is the practical free path for “last 3 seasons.”**

### Steps

1. Open **[https://dashboard.api-football.com/register](https://dashboard.api-football.com/register)**  
   (same ecosystem as API-Sports; Google signup works)
2. Confirm your email
3. In the dashboard, copy your **API key**
4. Save as `API_FOOTBALL_KEY`

You can also access via RapidAPI, but the direct dashboard key is simpler for server-side use.

### Free tier notes

- **100 requests/day** (tight — we will cache aggressively and batch ingest)
- All endpoints available; **historical season range is limited** vs paid, but usually covers **recent seasons** (enough to attempt last 3; we’ll verify per league on ingest)
- Header:

```http
x-apisports-key: YOUR_KEY
```

Base URL: `https://v3.football.api-sports.io`

Docs: [https://www.api-football.com/documentation-v3](https://www.api-football.com/documentation-v3)

### Quota reality for 3 seasons × 5 leagues

Rough first full ingest (fixtures + standings per league/season) can burn dozens of calls. Strategy:

- One scheduled batch, not per page view
- Store everything in Postgres
- Redis cache so the UI almost never hits providers live

If free daily quota is too low for refresh + backfill, upgrade later or throttle ingest across days.

---

## 3. Where to put the secrets

| Place | When |
|---|---|
| **Cursor Cloud Agent secrets** | So this agent can ingest/build in the cloud |
| **Local `.env.local`** | Your laptop (`cp .env.example .env.local`) |
| **Vercel project env** | Production / preview deploys |

Variable names (from `.env.example`):

```bash
FOOTBALL_DATA_API_TOKEN=
API_FOOTBALL_KEY=
```

---

## 4. Auth (Clerk) — later in Phase 0, not a football API

Auth uses **Clerk** (Vercel Marketplace). You’ll eventually need:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Those come from Clerk/Vercel after `vercel integration add clerk` (or the Clerk dashboard). Not required to register football APIs first.

---

## Recommended order for you

1. Register **football-data.org** (2 minutes) → paste `FOOTBALL_DATA_API_TOKEN`
2. Register **API-Football** (2 minutes) → paste `API_FOOTBALL_KEY`  
   *(important because you want last 3 seasons)*
3. Reply here when both are in secrets (or paste that they’re set — don’t paste the raw keys in chat)
