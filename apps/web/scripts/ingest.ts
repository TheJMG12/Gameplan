/**
 * Dual-source ingest CLI.
 *
 * Usage (from apps/web, with .env.local loaded):
 *   npm run ingest
 *   npm run ingest -- --max-jobs=4 --codes=PL,CL,WC
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { runDualSourceIngest } from "../src/lib/services/ingest";

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

  console.log("Starting dual-source ingest…", { maxJobs, codes, seasons, sources });
  const { results, summary } = await runDualSourceIngest({
    maxJobs,
    competitionCodes: codes,
    seasons,
    sources,
  });

  for (const result of results) {
    const status = result.ok ? "OK" : "FAIL";
    console.log(
      `[${status}] ${result.source} ${result.competition} ${result.season}` +
        (result.fixtures !== undefined ? ` fixtures=${result.fixtures}` : "") +
        (result.standingsRows !== undefined ? ` standings=${result.standingsRows}` : "") +
        (result.error ? ` error=${result.error}` : "") +
        (result.rawPath ? ` → ${result.rawPath}` : ""),
    );
  }

  console.log("Summary:", summary);
  if (summary.failed > 0 && summary.ok === 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
