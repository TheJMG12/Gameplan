import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  COMPETITIONS,
  seasonsForCompetition,
  type CompetitionDefinition,
} from "@/lib/domain/leagues";
import { getEnv, hasApiFootballKey, hasFootballDataToken } from "@/lib/env";
import {
  fetchFixturesFromApiFootball,
  fetchStandingsFromApiFootball,
} from "@/lib/providers/api-football";

export type IngestSource = "api-football" | "football-data";

export type IngestJobResult = {
  competition: string;
  season: number;
  source: IngestSource;
  kind: "fixtures" | "standings" | "crosswalk";
  ok: boolean;
  fixtures?: number;
  standingsRows?: number;
  teams?: number;
  error?: string;
  rawPath?: string;
};

function rawRoot() {
  return path.join(/*turbopackIgnore: true*/ process.cwd(), "..", "..", "data", "raw");
}

async function writeJson(relativeParts: string[], payload: unknown): Promise<string> {
  const dir = path.join(/*turbopackIgnore: true*/ rawRoot(), ...relativeParts.slice(0, -1));
  await mkdir(dir, { recursive: true });
  const filePath = path.join(/*turbopackIgnore: true*/ dir, relativeParts[relativeParts.length - 1]!);
  await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
  return filePath;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Authoritative: fixtures + standings (API-Football only).
 * See docs/DATA_SOURCES.md — do not also dump these from football-data.org.
 */
async function ingestOperationalFromApiFootball(
  competition: CompetitionDefinition,
  season: number,
): Promise<IngestJobResult[]> {
  const results: IngestJobResult[] = [];

  try {
    const standings = await fetchStandingsFromApiFootball(competition, season);
    const rawPath = await writeJson(
      ["api-football", competition.code, String(season), "standings.json"],
      standings,
    );
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      kind: "standings",
      ok: true,
      standingsRows: standings.table.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      kind: "standings",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  await sleep(1200);

  try {
    const fixtures = await fetchFixturesFromApiFootball(competition, season);
    const rawPath = await writeJson(
      ["api-football", competition.code, String(season), "fixtures.json"],
      fixtures,
    );
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      kind: "fixtures",
      ok: true,
      fixtures: fixtures.length,
      rawPath,
    });
  } catch (error) {
    results.push({
      competition: competition.code,
      season,
      source: "api-football",
      kind: "fixtures",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return results;
}

/**
 * Authoritative: ID crosswalk only (no fixtures / standings duplication).
 */
async function ingestCrosswalkFromFootballData(
  competition: CompetitionDefinition,
  season: number,
): Promise<IngestJobResult> {
  if (!competition.footballDataCode) {
    return {
      competition: competition.code,
      season,
      source: "football-data",
      kind: "crosswalk",
      ok: false,
      error: "No football-data.org mapping",
    };
  }

  if (!hasFootballDataToken()) {
    return {
      competition: competition.code,
      season,
      source: "football-data",
      kind: "crosswalk",
      ok: false,
      error: "FOOTBALL_DATA_API_TOKEN missing",
    };
  }

  const code = competition.footballDataCode;
  const headers = { "X-Auth-Token": getEnv().footballDataToken };

  try {
    const [competitionRes, teamsRes] = await Promise.all([
      fetch(`https://api.football-data.org/v4/competitions/${code}`, { headers }),
      fetch(`https://api.football-data.org/v4/competitions/${code}/teams?season=${season}`, {
        headers,
      }),
    ]);

    if (!competitionRes.ok) {
      throw new Error(`competition meta HTTP ${competitionRes.status}`);
    }
    if (!teamsRes.ok) {
      throw new Error(`teams HTTP ${teamsRes.status}`);
    }

    const competitionMeta = await competitionRes.json();
    const teamsPayload = (await teamsRes.json()) as {
      teams?: Array<{ id: number; name: string; shortName?: string; tla?: string; crest?: string }>;
    };

    const crosswalk = {
      source: "football-data",
      role: "crosswalk-only",
      gameplanCode: competition.code,
      season,
      competition: {
        id: competitionMeta.id,
        code: competitionMeta.code,
        name: competitionMeta.name,
      },
      teams: (teamsPayload.teams ?? []).map((team) => ({
        footballDataId: team.id,
        name: team.name,
        shortName: team.shortName,
        tla: team.tla,
        crest: team.crest,
      })),
    };

    const rawPath = await writeJson(
      ["football-data", competition.code, String(season), "crosswalk.json"],
      crosswalk,
    );

    await sleep(6500);

    return {
      competition: competition.code,
      season,
      source: "football-data",
      kind: "crosswalk",
      ok: true,
      teams: crosswalk.teams.length,
      rawPath,
    };
  } catch (error) {
    return {
      competition: competition.code,
      season,
      source: "football-data",
      kind: "crosswalk",
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export type RunIngestOptions = {
  /** Defaults: api-football operational + football-data crosswalk when keys exist. */
  sources?: IngestSource[];
  competitionCodes?: string[];
  seasons?: number[];
  maxJobs?: number;
};

/** @deprecated use runOperationalIngest */
export const runDualSourceIngest = runOperationalIngest;

export async function runOperationalIngest(
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
      if (sources.includes("api-football")) {
        if (options.maxJobs !== undefined && jobs >= options.maxJobs) {
          return summarize(results);
        }
        jobs += 1;
        results.push(...(await ingestOperationalFromApiFootball(competition, season)));
        await sleep(1200);
      }

      if (sources.includes("football-data")) {
        if (options.maxJobs !== undefined && jobs >= options.maxJobs) {
          return summarize(results);
        }
        jobs += 1;
        results.push(await ingestCrosswalkFromFootballData(competition, season));
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
    crosswalkTeams: results.reduce((sum, r) => sum + (r.teams ?? 0), 0),
  };
  return { results, summary };
}
