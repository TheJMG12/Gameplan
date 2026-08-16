import {
  defaultSeasonFor,
  getCompetitionBySlug,
  type CompetitionDefinition,
} from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";
import { hasApiFootballKey, hasFootballDataToken, providerStatus } from "@/lib/env";
import {
  fetchFixturesFromApiFootball,
  fetchStandingsFromApiFootball,
} from "@/lib/providers/api-football";
import {
  fetchFixturesFromFootballData,
  fetchStandingsFromFootballData,
} from "@/lib/providers/football-data";
import { emptyStandings, mockFixtures, mockStandings } from "@/lib/providers/mock";

export type LeagueBundle = {
  league: CompetitionDefinition;
  season: number;
  standings: Standings;
  fixtures: Fixture[];
  usingMock: boolean;
  sourcesAttempted: string[];
  errors: string[];
  keysConfigured: ReturnType<typeof providerStatus>;
};

async function loadStandings(
  competition: CompetitionDefinition,
  season: number,
  attempted: string[],
  errors: string[],
): Promise<Standings> {
  if (hasApiFootballKey()) {
    attempted.push("api-football");
    try {
      return await fetchStandingsFromApiFootball(competition, season);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[standings] api-football failed", message);
      errors.push(`standings/api-football: ${message}`);
    }
  }

  if (hasFootballDataToken() && competition.footballDataCode) {
    attempted.push("football-data");
    try {
      return await fetchStandingsFromFootballData(competition, season);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[standings] football-data failed", message);
      errors.push(`standings/football-data: ${message}`);
    }
  }

  if (!hasApiFootballKey() && !hasFootballDataToken()) {
    errors.push("No API keys found in env (API_FOOTBALL_KEY / FOOTBALL_DATA_API_TOKEN)");
  }

  if (competition.kind !== "domestic") {
    return emptyStandings(competition.code, season);
  }

  return mockStandings(competition.code, season);
}

async function loadFixtures(
  competition: CompetitionDefinition,
  season: number,
  attempted: string[],
  errors: string[],
): Promise<Fixture[]> {
  if (hasApiFootballKey()) {
    attempted.push("api-football");
    try {
      return await fetchFixturesFromApiFootball(competition, season);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[fixtures] api-football failed", message);
      errors.push(`fixtures/api-football: ${message}`);
    }
  }

  if (hasFootballDataToken() && competition.footballDataCode) {
    attempted.push("football-data");
    try {
      return await fetchFixturesFromFootballData(competition, season);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[fixtures] football-data failed", message);
      errors.push(`fixtures/football-data: ${message}`);
    }
  }

  return mockFixtures(competition.code, season);
}

export async function getLeagueBundle(
  slug: string,
  season?: number,
): Promise<LeagueBundle | null> {
  const competition = getCompetitionBySlug(slug);
  if (!competition) return null;

  const resolvedSeason = season ?? defaultSeasonFor(competition);
  const sourcesAttempted: string[] = [];
  const errors: string[] = [];

  const [standings, fixtures] = await Promise.all([
    loadStandings(competition, resolvedSeason, sourcesAttempted, errors),
    loadFixtures(competition, resolvedSeason, sourcesAttempted, errors),
  ]);

  return {
    league: competition,
    season: resolvedSeason,
    standings,
    fixtures,
    usingMock: standings.source === "mock" || fixtures.some((fixture) => fixture.source === "mock"),
    sourcesAttempted: [...new Set(sourcesAttempted)],
    errors,
    keysConfigured: providerStatus(),
  };
}
