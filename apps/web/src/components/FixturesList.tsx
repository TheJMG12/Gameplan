import type { Fixture } from "@/lib/domain/types";

function formatKickoff(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(iso));
}

export function FixturesList({ fixtures }: { fixtures: Fixture[] }) {
  if (fixtures.length === 0) {
    return <p className="text-sm text-muted">No fixtures in this window yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {fixtures.map((fixture) => (
        <li key={fixture.id} className="border border-line bg-surface/70 px-4 py-3">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.12em] text-muted">
            <span>{formatKickoff(fixture.utcDate)}</span>
            <span>{fixture.status}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-base font-medium text-brand">
            <span className="flex-1">{fixture.home.name}</span>
            <span className="min-w-14 text-center font-[family-name:var(--font-display)] text-xl tracking-wide text-accent">
              {fixture.status === "finished" && fixture.score
                ? `${fixture.score.home ?? "-"}–${fixture.score.away ?? "-"}`
                : "vs"}
            </span>
            <span className="flex-1 text-right">{fixture.away.name}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}
