import { getEnv, hasApiFootballKey } from "@/lib/env";
import type { CompetitionDefinition } from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";
import { FixtureSchema, StandingsSchema } from "@/lib/domain/types";

const BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballResponse<T> = {
  response: T;
  errors?: Record<string, string> | string[];
  results?: number;
};

type RawFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short?: string };
  };
  league: { round?: string };
  teams: {
    home: { id: number; name: string; logo?: string | null };
    away: { id: number; name: string; logo?: string | null };
  };
  goals: { home: number | null; away: number | null };
};

type RawStandingRow = {
  rank: number;
  team: { id: number; name: string; logo?: string | null };
  points: number;
  goalsDiff: number;
  form?: string;
  all: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: { for: number; against: number };
  };
};

async function apiFootballFetch<T>(
  path: string,
  params: Record<string, string | number>,
): Promise<T> {
  if (!hasApiFootballKey()) {
    throw new Error("API_FOOTBALL_KEY is not configured");
  }

  const url = new URL(path, BASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  const key = getEnv().apiFootballKey.trim();
  const response = await fetch(url, {
    headers: {
      "x-apisports-key": key,
      // Also accepted when the key was issued via RapidAPI dashboard copies
      "x-rapidapi-key": key,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API-Football ${path} failed: ${response.status} ${body.slice(0, 200)}`);
  }

  const remaining = response.headers.get("x-ratelimit-requests-remaining");
  if (remaining) {
    console.info(`[api-football] remaining=${remaining}`);
  }

  const json = (await response.json()) as ApiFootballResponse<T>;
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(json.errors)}`);
  }

  return json.response;
}

function mapStatus(short: string | undefined): Fixture["status"] {
  switch (short) {
    case "NS":
    case "TBD":
      return "scheduled";
    case "1H":
    case "2H":
    case "HT":
    case "ET":
    case "BT":
    case "P":
    case "LIVE":
      return "live";
    case "FT":
    case "AET":
    case "PEN":
      return "finished";
    case "PST":
      return "postponed";
    case "CANC":
    case "ABD":
      return "cancelled";
    default:
      return "unknown";
  }
}

function mapFixture(item: RawFixture, competition: CompetitionDefinition, season: number): Fixture | null {
  const parsed = FixtureSchema.safeParse({
    id: `af-${item.fixture.id}`,
    leagueCode: competition.code,
    season,
    utcDate: item.fixture.date,
    status: mapStatus(item.fixture.status.short),
    matchday: Number(item.league.round?.match(/\d+/)?.[0] ?? NaN) || null,
    home: {
      id: `af-${item.teams.home.id}`,
      name: item.teams.home.name,
      crestUrl: item.teams.home.logo ?? "",
    },
    away: {
      id: `af-${item.teams.away.id}`,
      name: item.teams.away.name,
      crestUrl: item.teams.away.logo ?? "",
    },
    score: {
      home: item.goals.home,
      away: item.goals.away,
    },
    source: "api-football",
  });
  return parsed.success ? parsed.data : null;
}

export async function fetchStandingsFromApiFootball(
  competition: CompetitionDefinition,
  season: number,
): Promise<Standings> {
  const response = await apiFootballFetch<
    Array<{
      league: {
        standings: Array<Array<RawStandingRow>>;
      };
    }>
  >("/standings", { league: competition.apiFootballId, season });

  // Domestic leagues: one TOTAL table. Cups: multiple groups — flatten for now.
  const blocks = response[0]?.league.standings ?? [];
  const table = blocks.flat();

  return StandingsSchema.parse({
    leagueCode: competition.code,
    season,
    updatedAt: new Date().toISOString(),
    source: "api-football",
    table: table.map((row) => ({
      position: row.rank,
      team: {
        id: `af-${row.team.id}`,
        name: row.team.name,
        crestUrl: row.team.logo ?? "",
      },
      played: row.all.played,
      won: row.all.win,
      draw: row.all.draw,
      lost: row.all.lose,
      goalsFor: row.all.goals.for,
      goalsAgainst: row.all.goals.against,
      goalDifference: row.goalsDiff,
      points: row.points,
      form: row.form,
    })),
  });
}

/** Display path: recent + upcoming only (saves quota vs full-season dump). */
export async function fetchFixturesFromApiFootball(
  competition: CompetitionDefinition,
  season: number,
): Promise<Fixture[]> {
  try {
    const [upcoming, recent] = await Promise.all([
      apiFootballFetch<RawFixture[]>("/fixtures", {
        league: competition.apiFootballId,
        season,
        next: 15,
      }),
      apiFootballFetch<RawFixture[]>("/fixtures", {
        league: competition.apiFootballId,
        season,
        last: 15,
      }),
    ]);

    const seen = new Set<string>();
    const fixtures: Fixture[] = [];
    for (const item of [...recent, ...upcoming]) {
      const mapped = mapFixture(item, competition, season);
      if (!mapped || seen.has(mapped.id)) continue;
      seen.add(mapped.id);
      fixtures.push(mapped);
    }

    fixtures.sort((a, b) => a.utcDate.localeCompare(b.utcDate));
    if (fixtures.length > 0) return fixtures;
  } catch (error) {
    console.warn("[api-football] next/last fixtures failed, falling back to season dump", error);
  }

  return fetchAllFixturesFromApiFootball(competition, season);
}

/** Full-season dump for ingest jobs. */
export async function fetchAllFixturesFromApiFootball(
  competition: CompetitionDefinition,
  season: number,
): Promise<Fixture[]> {
  const response = await apiFootballFetch<RawFixture[]>("/fixtures", {
    league: competition.apiFootballId,
    season,
  });

  return response
    .map((item) => mapFixture(item, competition, season))
    .filter((fixture): fixture is Fixture => fixture !== null);
}
