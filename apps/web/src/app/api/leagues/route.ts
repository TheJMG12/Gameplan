import { NextResponse } from "next/server";
import { COMPETITIONS, INGEST_SEASONS, WORLD_CUP_SEASONS } from "@/lib/domain/leagues";

export async function GET() {
  return NextResponse.json({
    competitions: COMPETITIONS,
    seasons: {
      european: INGEST_SEASONS,
      worldCup: WORLD_CUP_SEASONS,
    },
  });
}
