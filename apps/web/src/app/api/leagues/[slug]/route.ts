import { NextResponse } from "next/server";
import { getLeagueBySlug, INGEST_SEASONS } from "@/lib/domain/leagues";
import { getLeagueBundle } from "@/lib/services/league-data";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const league = getLeagueBySlug(slug);
  if (!league) {
    return NextResponse.json({ error: "League not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const seasonParam = Number(searchParams.get("season"));
  const season = INGEST_SEASONS.includes(seasonParam as (typeof INGEST_SEASONS)[number])
    ? seasonParam
    : INGEST_SEASONS[INGEST_SEASONS.length - 1];

  const bundle = await getLeagueBundle(slug, season);
  return NextResponse.json(bundle);
}
