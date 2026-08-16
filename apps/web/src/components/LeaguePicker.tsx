import Link from "next/link";
import { COMPETITIONS, type CompetitionKind } from "@/lib/domain/leagues";

const KIND_LABEL: Record<CompetitionKind, string> = {
  domestic: "Top 5",
  uefa: "UEFA",
  international: "World",
};

export function LeaguePicker({
  activeSlug,
  kinds,
}: {
  activeSlug?: string;
  kinds?: CompetitionKind[];
}) {
  const competitions = COMPETITIONS.filter((competition) =>
    kinds?.length ? kinds.includes(competition.kind) : true,
  );

  const grouped = (["domestic", "uefa", "international"] as CompetitionKind[])
    .map((kind) => ({
      kind,
      items: competitions.filter((competition) => competition.kind === kind),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="space-y-3">
      {grouped.map((group) => (
        <div key={group.kind}>
          <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted">
            {KIND_LABEL[group.kind]}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.items.map((competition) => {
              const active = competition.slug === activeSlug;
              return (
                <Link
                  key={competition.code}
                  href={`/leagues/${competition.slug}`}
                  className={
                    active
                      ? "border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-[var(--bg-deep)] transition-transform hover:scale-[1.02]"
                      : "border border-line bg-surface px-3 py-1.5 text-sm text-brand/90 transition-colors hover:border-accent/50 hover:text-brand"
                  }
                >
                  {competition.name}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
