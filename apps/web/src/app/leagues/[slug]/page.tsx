import { notFound } from "next/navigation";
import { FixturesList } from "@/components/FixturesList";
import { LeaguePicker } from "@/components/LeaguePicker";
import { StandingsTable } from "@/components/StandingsTable";
import {
  COMPETITIONS,
  defaultSeasonFor,
  getCompetitionBySlug,
  seasonsForCompetition,
} from "@/lib/domain/leagues";
import { getLeagueBundle } from "@/lib/services/league-data";

export const dynamic = "force-dynamic";

type LeaguePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ season?: string }>;
};

export function generateStaticParams() {
  return COMPETITIONS.map((competition) => ({ slug: competition.slug }));
}

export default async function LeaguePage({ params, searchParams }: LeaguePageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const competition = getCompetitionBySlug(slug);
  if (!competition) notFound();

  const seasons = seasonsForCompetition(competition);
  const requested = Number(query.season);
  const season = seasons.includes(requested) ? requested : defaultSeasonFor(competition);
  const bundle = await getLeagueBundle(slug, season);

  if (!bundle) notFound();

  const upcoming = bundle.fixtures
    .filter((fixture) => fixture.status === "scheduled" || fixture.status === "live")
    .slice(0, 8);
  const recent = bundle.fixtures
    .filter((fixture) => fixture.status === "finished")
    .slice(-8)
    .reverse();

  const seasonLabel =
    competition.seasonMode === "tournament"
      ? String(bundle.season)
      : `${bundle.season}/${bundle.season + 1}`;

  const sourceLabel = bundle.usingMock
    ? "mock data"
    : bundle.standings.source !== "mock"
      ? bundle.standings.source
      : bundle.fixtures.find((f) => f.source !== "mock")?.source ?? "live";

  return (
    <main className="relative min-h-screen bg-[linear-gradient(180deg,#07140f_0%,#020403_100%)] pt-24">
      <div className="mx-auto w-full max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.24em] text-accent">{bundle.league.region}</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-5xl tracking-[0.06em] text-brand sm:text-6xl">
            {bundle.league.name}
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-muted">
            {competition.seasonMode === "tournament" ? "Tournament" : "Season"} {seasonLabel}
            {" · "}
            source: {sourceLabel}
          </p>
          {bundle.usingMock && (
            <div className="mt-4 border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-brand">
              <p className="font-medium text-accent">Showing filler data</p>
              <p className="mt-1 text-muted">
                Keys loaded: API-Football{" "}
                {bundle.keysConfigured.apiFootball ? "yes" : "no"} · football-data.org{" "}
                {bundle.keysConfigured.footballData ? "yes" : "no"}
              </p>
              {bundle.errors.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted">
                  {bundle.errors.slice(0, 4).map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">
                Put keys in <code className="text-brand">apps/web/.env.local</code>, restart{" "}
                <code className="text-brand">npm run dev</code>, then refresh.
              </p>
            </div>
          )}
        </div>

        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <LeaguePicker activeSlug={bundle.league.slug} />
          <div className="flex flex-wrap gap-2">
            {seasons.map((year) => (
              <a
                key={year}
                href={`/leagues/${bundle.league.slug}?season=${year}`}
                className={
                  year === bundle.season
                    ? "border border-accent px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-accent"
                    : "border border-line px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-muted hover:text-brand"
                }
              >
                {year}
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section>
            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-brand">
              Standings
            </h2>
            {bundle.standings.table.length > 0 ? (
              <StandingsTable rows={bundle.standings.table} />
            ) : (
              <p className="text-sm text-muted">
                No flat table for this competition/season (common for cups &amp; tournaments).
              </p>
            )}
          </section>

          <section className="space-y-8">
            <div>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-brand">
                Upcoming
              </h2>
              <FixturesList fixtures={upcoming} />
            </div>
            <div>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl tracking-[0.08em] text-brand">
                Recent
              </h2>
              <FixturesList fixtures={recent} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
