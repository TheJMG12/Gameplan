import { getEnv, hasFootballDataToken } from "@/lib/env";
import type { CompetitionDefinition } from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";
import { FixtureSchema, StandingsSchema } from "@/lib/domain/types";

const BASE_URL = "https://api.football-data.org/v4";

async function footballDataFetch<T>(path: string): Promise<T> {
  if (!hasFootballDataToken()) {
    throw new Error("FOOTBALL_DATA_API_TOKEN is not configured");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "X-Auth-Token": getEnv().footballDataToken.trim(),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`football-data.org ${path} failed: ${response.status}`);
  }

  const remaining = response.headers.get("X-Requests-Available-Minute");
  if (remaining) {
    console.info(`[football-data] remaining-minute=${remaining}`);
  }

  return (await response.json()) as T;
}

function mapStatus(status: string | undefined): Fixture["status"] {
  switch (status) {
    case "SCHEDULED":
    case "TIMED":
      return "scheduled";
    case "IN_PLAY":
    case "PAUSED":
    case "LIVE":
      return "live";
    case "FINISHED":
      return "finished";
    case "POSTPONED":
      return "postponed";
    case "CANCELLED":
    case "SUSPENDED":
      return "cancelled";
    default:
      return "unknown";
  }
}

function requireFootballDataCode(competition: CompetitionDefinition): string {
  if (!competition.footballDataCode) {
    throw new Error(`${competition.code} has no football-data.org mapping`);
  }
  return competition.footballDataCode;
}

export async function fetchStandingsFromFootballData(
  competition: CompetitionDefinition,
  season: number,
): Promise<Standings> {
  const code = requireFootballDataCode(competition);
  const data = await footballDataFetch<{
    standings: Array<{
      type: string;
      table: Array<{
        position: number;
        team: { id: number; name: string; shortName?: string; crest?: string };
        playedGames: number;
        won: number;
        draw: number;
        lost: number;
        goalsFor: number;
        goalsAgainst: number;
        goalDifference: number;
        points: number;
        form?: string;
      }>;
    }>;
  }>(`/competitions/${code}/standings?season=${season}`);

  const table =
    data.standings.find((block) => block.type === "TOTAL")?.table ??
    data.standings[0]?.table ??
    [];

  return StandingsSchema.parse({
    leagueCode: competition.code,
    season,
    updatedAt: new Date().toISOString(),
    source: "football-data",
    table: table.map((row) => ({
      position: row.position,
      team: {
        id: `fd-${row.team.id}`,
        name: row.team.name,
        shortName: row.team.shortName,
        crestUrl: row.team.crest ?? "",
      },
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      goalsFor: row.goalsFor,
      goalsAgainst: row.goalsAgainst,
      goalDifference: row.goalDifference,
      points: row.points,
      form: row.form,
    })),
  });
}

export async function fetchFixturesFromFootballData(
  competition: CompetitionDefinition,
  season: number,
): Promise<Fixture[]> {
  const code = requireFootballDataCode(competition);
  const data = await footballDataFetch<{
    matches: Array<{
      id: number;
      utcDate: string;
      status: string;
      matchday: number | null;
      homeTeam: { id: number; name: string; shortName?: string; crest?: string };
      awayTeam: { id: number; name: string; shortName?: string; crest?: string };
      score: {
        fullTime: { home: number | null; away: number | null };
      };
    }>;
  }>(`/competitions/${code}/matches?season=${season}`);

  return data.matches.map((match) =>
    FixtureSchema.parse({
      id: `fd-${match.id}`,
      leagueCode: competition.code,
      season,
      utcDate: match.utcDate,
      status: mapStatus(match.status),
      matchday: match.matchday,
      home: {
        id: `fd-${match.homeTeam.id}`,
        name: match.homeTeam.name,
        shortName: match.homeTeam.shortName,
        crestUrl: match.homeTeam.crest ?? "",
      },
      away: {
        id: `fd-${match.awayTeam.id}`,
        name: match.awayTeam.name,
        shortName: match.awayTeam.shortName,
        crestUrl: match.awayTeam.crest ?? "",
      },
      score: {
        home: match.score.fullTime.home,
        away: match.score.fullTime.away,
      },
      source: "football-data",
    }),
  );
}
