import Link from "next/link";
import { LeaguePicker } from "@/components/LeaguePicker";
import { COMPETITIONS } from "@/lib/domain/leagues";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1672634443106-e15e48aea8e1?auto=format&fit=crop&w=2400&q=80";

export default function HomePage() {
  const premier = COMPETITIONS.find((c) => c.code === "PL") ?? COMPETITIONS[0];

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="absolute inset-0">
        <div
          className="ambient-light absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_IMAGE})` }}
          role="img"
          aria-label="FC Barcelona Camp Nou stadium"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(2,4,3,0.55) 0%, rgba(7,20,15,0.72) 45%, rgba(2,4,3,0.94) 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at 70% 20%, rgba(184,245,58,0.18), transparent 45%)",
          }}
          aria-hidden
        />
      </div>

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-end px-5 pb-16 pt-28 sm:px-8 sm:pb-20">
        <p className="rise-in mb-4 text-xs uppercase tracking-[0.28em] text-accent">
          Top 5 · UEFA · World Cup
        </p>
        <h1 className="rise-in rise-in-delay-1 font-[family-name:var(--font-display)] text-6xl leading-[0.9] tracking-[0.04em] text-brand sm:text-8xl">
          GAMEPLAN
        </h1>
        <p className="rise-in rise-in-delay-2 mt-5 max-w-xl text-base text-brand/80 sm:text-lg">
          Correlate multi-source soccer data — domestic leagues, European nights, and the World Cup
          — then analyze, compare, and predict.
        </p>
        <div className="rise-in rise-in-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <Link
            href={`/leagues/${premier.slug}`}
            className="cta-pulse border border-accent bg-accent px-5 py-3 text-sm font-semibold tracking-wide text-[var(--bg-deep)] transition-transform hover:scale-[1.02]"
          >
            Enter Premier League
          </Link>
          <Link
            href="/leagues/champions-league"
            className="border border-line px-5 py-3 text-sm text-brand transition-colors hover:border-accent/60"
          >
            Champions League
          </Link>
        </div>
        <div className="rise-in rise-in-delay-3 mt-10">
          <LeaguePicker />
        </div>
      </section>
    </main>
  );
}
