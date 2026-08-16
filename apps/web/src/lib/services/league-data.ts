import {
  currentSeasonStartYear,
  defaultSeasonFor,
  getCompetitionBySlug,
  type CompetitionDefinition,
} from "@/lib/domain/leagues";
import type { Fixture, Standings } from "@/lib/domain/types";
import { hasApiFootballKey, hasFootballDataToken } from "@/lib/env";
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
};

async function loadStandings(
  competition: CompetitionDefinition,
  season: number,
  attempted: string[],
): Promise<Standings> {
  if (hasApiFootballKey()) {
    attempted.push("api-football");
    try {
      return await fetchStandingsFromApiFootball(competition, season);
    } catch (error) {
      console.warn("[standings] api-football failed", error);
    }
  }

  if (hasFootballDataToken() && competition.footballDataCode) {
    attempted.push("football-data");
    try {
      return await fetchStandingsFromFootballData(competition, season);
    } catch (error) {
      console.warn("[standings] football-data failed", error);
    }
  }

  // Cups / WC may lack a flat table; prefer empty over misleading mock for non-domestic.
  if (competition.kind !== "domestic") {
    return emptyStandings(competition.code, season);
  }

  return mockStandings(competition.code, season);
}

async function loadFixtures(
  competition: CompetitionDefinition,
  season: number,
  attempted: string[],
): Promise<Fixture[]> {
  if (hasApiFootballKey()) {
    attempted.push("api-football");
    try {
      return await fetchFixturesFromApiFootball(competition, season);
    } catch (error) {
      console.warn("[fixtures] api-football failed", error);
    }
  }

  if (hasFootballDataToken() && competition.footballDataCode) {
    attempted.push("football-data");
    try {
      return await fetchFixturesFromFootballData(competition, season);
    } catch (error) {
      console.warn("[fixtures] football-data failed", error);
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

  const [standings, fixtures] = await Promise.all([
    loadStandings(competition, resolvedSeason, sourcesAttempted),
    loadFixtures(competition, resolvedSeason, sourcesAttempted),
  ]);

  return {
    league: competition,
    season: resolvedSeason,
    standings,
    fixtures,
    usingMock: standings.source === "mock" || fixtures.some((fixture) => fixture.source === "mock"),
    sourcesAttempted: [...new Set(sourcesAttempted)],
  };
}

export { currentSeasonStartYear };
