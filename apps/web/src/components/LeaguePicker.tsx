import Link from "next/link";
import { TOP_5_LEAGUES } from "@/lib/domain/leagues";

export function LeaguePicker({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TOP_5_LEAGUES.map((league) => {
        const active = league.slug === activeSlug;
        return (
          <Link
            key={league.code}
            href={`/leagues/${league.slug}`}
            className={
              active
                ? "border border-accent bg-accent px-3 py-1.5 text-sm font-medium text-[var(--bg-deep)] transition-transform hover:scale-[1.02]"
                : "border border-line bg-surface px-3 py-1.5 text-sm text-brand/90 transition-colors hover:border-accent/50 hover:text-brand"
            }
          >
            {league.name}
          </Link>
        );
      })}
    </div>
  );
}
