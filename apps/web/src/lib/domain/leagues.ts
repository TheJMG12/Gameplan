export const INGEST_SEASONS = [2023, 2024, 2025] as const;

export type SeasonYear = (typeof INGEST_SEASONS)[number];

export type LeagueCode = "PL" | "PD" | "BL1" | "SA" | "FL1";

export type LeagueDefinition = {
  code: LeagueCode;
  name: string;
  country: string;
  slug: string;
  apiFootballId: number;
  footballDataCode: LeagueCode;
};

/** Top 5 European leagues — hard-coded until Phase 4 expansion. */
export const TOP_5_LEAGUES: readonly LeagueDefinition[] = [
  {
    code: "PL",
    name: "Premier League",
    country: "England",
    slug: "premier-league",
    apiFootballId: 39,
    footballDataCode: "PL",
  },
  {
    code: "PD",
    name: "La Liga",
    country: "Spain",
    slug: "la-liga",
    apiFootballId: 140,
    footballDataCode: "PD",
  },
  {
    code: "BL1",
    name: "Bundesliga",
    country: "Germany",
    slug: "bundesliga",
    apiFootballId: 78,
    footballDataCode: "BL1",
  },
  {
    code: "SA",
    name: "Serie A",
    country: "Italy",
    slug: "serie-a",
    apiFootballId: 135,
    footballDataCode: "SA",
  },
  {
    code: "FL1",
    name: "Ligue 1",
    country: "France",
    slug: "ligue-1",
    apiFootballId: 61,
    footballDataCode: "FL1",
  },
] as const;

export function getLeagueBySlug(slug: string): LeagueDefinition | undefined {
  return TOP_5_LEAGUES.find((league) => league.slug === slug);
}

export function getLeagueByCode(code: string): LeagueDefinition | undefined {
  return TOP_5_LEAGUES.find((league) => league.code === code);
}

export function currentSeasonStartYear(now = new Date()): SeasonYear {
  // European seasons typically flip in July.
  const year = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const match = INGEST_SEASONS.find((season) => season === year);
  return match ?? INGEST_SEASONS[INGEST_SEASONS.length - 1];
}
