/**
 * Operational ingest CLI (non-overlapping ownership).
 *
 * API-Football → fixtures + standings
 * football-data.org → ID crosswalk only
 *
 * Advanced metrics / events: `npm run ingest:all` (adds soccerdata + StatsBomb)
 *
 *   npm run ingest
 *   npm run ingest -- --max-jobs=4 --codes=PL,CL,WC
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { runOperationalIngest } from "../src/lib/services/ingest";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const hit = process.argv.find((value) => value.startsWith(prefix));
  return hit?.slice(prefix.length);
}

async function main() {
  const maxJobs = arg("max-jobs") ? Number(arg("max-jobs")) : undefined;
  const codes = arg("codes")?.split(",").map((value) => value.trim()).filter(Boolean);
  const seasons = arg("seasons")
    ?.split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value));
  const sources = arg("sources")
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean) as Array<"api-football" | "football-data"> | undefined;

  console.log("Starting operational ingest (no fixture overlap)…", {
    maxJobs,
    codes,
    seasons,
    sources,
  });
  const { results, summary } = await runOperationalIngest({
    maxJobs,
    competitionCodes: codes,
    seasons,
    sources,
  });

  for (const result of results) {
    const status = result.ok ? "OK" : "FAIL";
    console.log(
      `[${status}] ${result.source}/${result.kind} ${result.competition} ${result.season}` +
        (result.fixtures !== undefined ? ` fixtures=${result.fixtures}` : "") +
        (result.standingsRows !== undefined ? ` standings=${result.standingsRows}` : "") +
        (result.teams !== undefined ? ` teams=${result.teams}` : "") +
        (result.error ? ` error=${result.error}` : "") +
        (result.rawPath ? ` → ${result.rawPath}` : ""),
    );
  }

  console.log("Summary:", summary);
  console.log("Next: from repo root run `npm run ingest:all` for soccerdata + StatsBomb.");
  if (summary.failed > 0 && summary.ok === 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
