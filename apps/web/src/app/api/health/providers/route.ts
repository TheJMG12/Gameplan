import { NextResponse } from "next/server";
import { providerStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Does not expose secret values — only whether they are present. */
export async function GET() {
  const keys = providerStatus();
  return NextResponse.json({
    ok: keys.apiFootball || keys.footballData,
    keys: {
      API_FOOTBALL_KEY: keys.apiFootball,
      FOOTBALL_DATA_API_TOKEN: keys.footballData,
    },
    hint: keys.apiFootball
      ? "API-Football key detected — league pages should load live data."
      : "Add API_FOOTBALL_KEY to apps/web/.env.local and restart npm run dev.",
  });
}
