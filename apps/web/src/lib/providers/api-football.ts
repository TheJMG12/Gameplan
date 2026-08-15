import { getEnv, hasApiFootballKey } from "@/lib/env";
import type { LeagueDefinition } from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";
import { FixtureSchema, StandingsSchema } from "@/lib/domain/types";

const BASE_URL = "https://v3.football.api-sports.io";

type ApiFootballResponse<T> = {
  response: T;
  errors?: Record<string, string> | string[];
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

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": getEnv().apiFootballKey,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`API-Football ${path} failed: ${response.status}`);
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

export async function fetchStandingsFromApiFootball(
  league: LeagueDefinition,
  season: number,
): Promise<Standings> {
  const response = await apiFootballFetch<
    Array<{
      league: {
        standings: Array<
          Array<{
            rank: number;
            team: { id: number; name: string; logo?: string };
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
          }>
        >;
      };
    }>
  >("/standings", { league: league.apiFootballId, season });

  const table = response[0]?.league.standings[0] ?? [];

  return StandingsSchema.parse({
    leagueCode: league.code,
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

export async function fetchFixturesFromApiFootball(
  league: LeagueDefinition,
  season: number,
): Promise<Fixture[]> {
  const response = await apiFootballFetch<
    Array<{
      fixture: {
        id: number;
        date: string;
        status: { short?: string };
      };
      league: { round?: string };
      teams: {
        home: { id: number; name: string; logo?: string };
        away: { id: number; name: string; logo?: string };
      };
      goals: { home: number | null; away: number | null };
    }>
  >("/fixtures", { league: league.apiFootballId, season });

  return response.map((item) =>
    FixtureSchema.parse({
      id: `af-${item.fixture.id}`,
      leagueCode: league.code,
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
    }),
  );
}
