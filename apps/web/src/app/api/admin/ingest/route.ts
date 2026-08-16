import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";
import { runDualSourceIngest } from "@/lib/services/ingest";

export const runtime = "nodejs";
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = getEnv().cronSecret;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    sources?: Array<"api-football" | "football-data">;
    competitionCodes?: string[];
    seasons?: number[];
    maxJobs?: number;
  };

  try {
    const result = await runDualSourceIngest({
      sources: body.sources,
      competitionCodes: body.competitionCodes,
      seasons: body.seasons,
      maxJobs: body.maxJobs ?? 6,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
