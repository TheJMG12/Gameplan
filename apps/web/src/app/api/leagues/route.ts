import { NextResponse } from "next/server";
import { TOP_5_LEAGUES } from "@/lib/domain/leagues";

export async function GET() {
  return NextResponse.json({
    leagues: TOP_5_LEAGUES,
    seasons: [2023, 2024, 2025],
  });
}
