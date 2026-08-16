import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  COMPETITIONS,
  seasonsForCompetition,
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

export type IngestSource = "api-football" | "football-data";

export type IngestJobResult = {
  competition: string;
  season: number;
  source: IngestSource;
  ok: boolean;
  fixtures?: number;
  standingsRows?: number;
  error?: string;
  rawPath?: string;
};

function rawRoot() {
  // Keep path statically scoped so Turbopack does not trace the whole monorepo.
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "raw");
}

async function writeRaw(
  source: IngestSource,
  competition: CompetitionDefinition,
  season: number,
  kind: "fixtures" | "standings",
  payload: unknown,
): Promise<string> {
  const dir = path.join(/*turbopackIgnore: true*/ rawRoot(), source, competition.code, String(season));
  await mkdir(dir, { recursive: true });
  const filePath = path.join(/*turbopackIgnore: true*/ dir, `${kind}.json`);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ingestFromApiFootball(
  competition: CompetitionDefinition,
  season: number,
): Promise<IngestJobResult[]> {
  const results: IngestJobResult[] = [];

  try {
    const standings = await fetchStandingsFromApiFootball(competition, season);
    const rawPath = await writeRaw("api-football", competition, season, "standings", standings);
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      ok: true,
      standingsRows: standings.table.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await sleep(1200);

  try {
    const fixtures = await fetchFixturesFromApiFootball(competition, season);
    const rawPath = await writeRaw("api-football", competition, season, "fixtures", fixtures);
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      ok: true,
      fixtures: fixtures.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

async function ingestFromFootballData(
  competition: CompetitionDefinition,
  season: number,
): Promise<IngestJobResult[]> {
  if (!competition.footballDataCode) {
    return [
      {
        competition: competition.code,
        season,
        source: "football-data",
        ok: false,
        error: "No football-data.org mapping",
      },
    ];
  }

  const results: IngestJobResult[] = [];

  try {
    const standings = await fetchStandingsFromFootballData(competition, season);
    const rawPath = await writeRaw("football-data", competition, season, "standings", standings);
    results.push({
      competition: competition.code,
      season,
      source: "football-data",
      ok: true,
      standingsRows: standings.table.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "football-data",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await sleep(6500); // free tier ~10 req/min

  try {
    const fixtures = await fetchFixturesFromFootballData(competition, season);
    const rawPath = await writeRaw("football-data", competition, season, "fixtures", fixtures);
    results.push({
      competition: competition.code,
      season,
      source: "football-data",
      ok: true,
      fixtures: fixtures.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "football-data",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

export type RunIngestOptions = {
  sources?: IngestSource[];
  competitionCodes?: string[];
  seasons?: number[];
  /** Cap work for free-tier smoke tests. */
  maxJobs?: number;
};

export async function runDualSourceIngest(
  options: RunIngestOptions = {},
): Promise<{ results: IngestJobResult[]; summary: Record<string, number> }> {
  const sources = options.sources ?? [
    ...(hasApiFootballKey() ? (["api-football"] as const) : []),
    ...(hasFootballDataToken() ? (["football-data"] as const) : []),
  ];

  if (sources.length === 0) {
    throw new Error("No API keys configured. Set API_FOOTBALL_KEY and/or FOOTBALL_DATA_API_TOKEN.");
  }

  const competitions = COMPETITIONS.filter((competition) =>
    options.competitionCodes?.length
      ? options.competitionCodes.includes(competition.code)
      : true,
  );

  const results: IngestJobResult[] = [];
  let jobs = 0;

  for (const competition of competitions) {
    const seasons = (options.seasons ?? seasonsForCompetition(competition)).filter(Boolean);
    for (const season of seasons) {
      for (const source of sources) {
        if (options.maxJobs !== undefined && jobs >= options.maxJobs) {
          return summarize(results);
        }
        jobs += 1;
        if (source === "api-football") {
          results.push(...(await ingestFromApiFootball(competition, season)));
          await sleep(1200);
        } else {
          results.push(...(await ingestFromFootballData(competition, season)));
        }
      }
    }
  }

  return summarize(results);
}

function summarize(results: IngestJobResult[]) {
  const summary = {
    total: results.length,
    ok: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    fixtures: results.reduce((sum, r) => sum + (r.fixtures ?? 0), 0),
    standingsRows: results.reduce((sum, r) => sum + (r.standingsRows ?? 0), 0),
  };
  return { results, summary };
}

export type DualSourceBundle = {
  competition: CompetitionDefinition;
  season: number;
  standings: Standings;
  fixtures: Fixture[];
  sourcesUsed: IngestSource[];
};
