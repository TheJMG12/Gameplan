import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-[0.18em] text-brand">
          GAMEPLAN
        </Link>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <Link href="/leagues/premier-league" className="transition-colors hover:text-brand">
            Leagues
          </Link>
          <span className="rounded-full border border-line px-3 py-1 text-xs uppercase tracking-[0.14em] text-muted">
            Sign in soon
          </span>
        </nav>
      </div>
    </header>
  );
}
