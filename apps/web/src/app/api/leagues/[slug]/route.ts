import { NextResponse } from "next/server";
import {
  defaultSeasonFor,
  getCompetitionBySlug,
  seasonsForCompetition,
} from "@/lib/domain/leagues";
import { getLeagueBundle } from "@/lib/services/league-data";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const competition = getCompetitionBySlug(slug);
  if (!competition) {
    return NextResponse.json({ error: "Competition not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const seasonParam = Number(searchParams.get("season"));
  const allowed = seasonsForCompetition(competition);
  const season = allowed.includes(seasonParam) ? seasonParam : defaultSeasonFor(competition);

  const bundle = await getLeagueBundle(slug, season);
  return NextResponse.json(bundle);
}
