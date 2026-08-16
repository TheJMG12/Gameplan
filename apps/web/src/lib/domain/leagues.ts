export const INGEST_SEASONS = [2023, 2024, 2025] as const;

/** FIFA World Cup tournament years in scope (not European club season years). */
export const WORLD_CUP_SEASONS = [2022, 2026] as const;

export type SeasonYear = (typeof INGEST_SEASONS)[number];
export type WorldCupYear = (typeof WORLD_CUP_SEASONS)[number];

export type CompetitionKind = "domestic" | "uefa" | "international";
export type SeasonMode = "european" | "tournament";

export type CompetitionCode =
  | "PL"
  | "PD"
  | "BL1"
  | "SA"
  | "FL1"
  | "CL"
  | "EL"
  | "ECL"
  | "WC";

export type CompetitionDefinition = {
  code: CompetitionCode;
  name: string;
  region: string;
  slug: string;
  kind: CompetitionKind;
  seasonMode: SeasonMode;
  apiFootballId: number;
  /** football-data.org league code; Conference League uses `UCL` in their API. */
  footballDataCode: string | null;
};

/** Domestic top 5 + UEFA club competitions + FIFA World Cup. */
export const COMPETITIONS: readonly CompetitionDefinition[] = [
  {
    code: "PL",
    name: "Premier League",
    region: "England",
    slug: "premier-league",
    kind: "domestic",
    seasonMode: "european",
    apiFootballId: 39,
    footballDataCode: "PL",
  },
  {
    code: "PD",
    name: "La Liga",
    region: "Spain",
    slug: "la-liga",
    kind: "domestic",
    seasonMode: "european",
    apiFootballId: 140,
    footballDataCode: "PD",
  },
  {
    code: "BL1",
    name: "Bundesliga",
    region: "Germany",
    slug: "bundesliga",
    kind: "domestic",
    seasonMode: "european",
    apiFootballId: 78,
    footballDataCode: "BL1",
  },
  {
    code: "SA",
    name: "Serie A",
    region: "Italy",
    slug: "serie-a",
    kind: "domestic",
    seasonMode: "european",
    apiFootballId: 135,
    footballDataCode: "SA",
  },
  {
    code: "FL1",
    name: "Ligue 1",
    region: "France",
    slug: "ligue-1",
    kind: "domestic",
    seasonMode: "european",
    apiFootballId: 61,
    footballDataCode: "FL1",
  },
  {
    code: "CL",
    name: "UEFA Champions League",
    region: "Europe",
    slug: "champions-league",
    kind: "uefa",
    seasonMode: "european",
    apiFootballId: 2,
    footballDataCode: "CL",
  },
  {
    code: "EL",
    name: "UEFA Europa League",
    region: "Europe",
    slug: "europa-league",
    kind: "uefa",
    seasonMode: "european",
    apiFootballId: 3,
    footballDataCode: "EL",
  },
  {
    code: "ECL",
    name: "UEFA Conference League",
    region: "Europe",
    slug: "conference-league",
    kind: "uefa",
    seasonMode: "european",
    apiFootballId: 848,
    footballDataCode: "UCL",
  },
  {
    code: "WC",
    name: "FIFA World Cup",
    region: "World",
    slug: "world-cup",
    kind: "international",
    seasonMode: "tournament",
    apiFootballId: 1,
    footballDataCode: "WC",
  },
] as const;

/** @deprecated Prefer COMPETITIONS.filter(c => c.kind === "domestic") */
export const TOP_5_LEAGUES = COMPETITIONS.filter((c) => c.kind === "domestic");

export type LeagueCode = CompetitionCode;
export type LeagueDefinition = CompetitionDefinition;

export function getCompetitionBySlug(slug: string): CompetitionDefinition | undefined {
  return COMPETITIONS.find((competition) => competition.slug === slug);
}

export function getCompetitionByCode(code: string): CompetitionDefinition | undefined {
  return COMPETITIONS.find((competition) => competition.code === code);
}

export const getLeagueBySlug = getCompetitionBySlug;
export const getLeagueByCode = getCompetitionByCode;

export function seasonsForCompetition(competition: CompetitionDefinition): readonly number[] {
  if (competition.seasonMode === "tournament") {
    return WORLD_CUP_SEASONS;
  }
  return INGEST_SEASONS;
}

export function currentSeasonStartYear(now = new Date()): number {
  const year = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const match = INGEST_SEASONS.find((season) => season === year);
  return match ?? INGEST_SEASONS[INGEST_SEASONS.length - 1];
}

export function defaultSeasonFor(competition: CompetitionDefinition, now = new Date()): number {
  const seasons = seasonsForCompetition(competition);
  if (competition.seasonMode === "tournament") {
    // Prefer the next/upcoming World Cup if present, else latest past.
    const upcoming = [...seasons].find((year) => year >= now.getUTCFullYear());
    return upcoming ?? seasons[seasons.length - 1];
  }
  const current = currentSeasonStartYear(now);
  return seasons.includes(current) ? current : seasons[seasons.length - 1];
}
