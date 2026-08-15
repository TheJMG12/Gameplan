import {
  currentSeasonStartYear,
  getLeagueBySlug,
  type LeagueDefinition,
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
import { mockFixtures, mockStandings } from "@/lib/providers/mock";

export type LeagueBundle = {
  league: LeagueDefinition;
  season: number;
  standings: Standings;
  fixtures: Fixture[];
  usingMock: boolean;
};

async function loadStandings(league: LeagueDefinition, season: number): Promise<Standings> {
  if (hasApiFootballKey()) {
    try {
      return await fetchStandingsFromApiFootball(league, season);
    } catch (error) {
      console.warn("[standings] api-football failed", error);
    }
  }

  if (hasFootballDataToken()) {
    try {
      return await fetchStandingsFromFootballData(league, season);
    } catch (error) {
      console.warn("[standings] football-data failed", error);
    }
  }

  return mockStandings(league.code, season);
}

async function loadFixtures(league: LeagueDefinition, season: number): Promise<Fixture[]> {
  if (hasApiFootballKey()) {
    try {
      return await fetchFixturesFromApiFootball(league, season);
    } catch (error) {
      console.warn("[fixtures] api-football failed", error);
    }
  }

  if (hasFootballDataToken()) {
    try {
      return await fetchFixturesFromFootballData(league, season);
    } catch (error) {
      console.warn("[fixtures] football-data failed", error);
    }
  }

  return mockFixtures(league.code, season);
}

export async function getLeagueBundle(
  slug: string,
  season: number = currentSeasonStartYear(),
): Promise<LeagueBundle | null> {
  const league = getLeagueBySlug(slug);
  if (!league) return null;

  const [standings, fixtures] = await Promise.all([
    loadStandings(league, season),
    loadFixtures(league, season),
  ]);

  return {
    league,
    season,
    standings,
    fixtures,
    usingMock: standings.source === "mock" || fixtures.some((fixture) => fixture.source === "mock"),
  };
}
