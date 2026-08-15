import type { StandingRow } from "@/lib/domain/types";

export function StandingsTable({ rows }: { rows: StandingRow[] }) {
  return (
    <div className="overflow-x-auto border border-line bg-surface/70">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-[0.12em] text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Club</th>
            <th className="px-4 py-3 font-medium">P</th>
            <th className="px-4 py-3 font-medium">GD</th>
            <th className="px-4 py-3 font-medium">Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.team.id} className="border-b border-line/60 last:border-none">
              <td className="px-4 py-3 text-muted">{row.position}</td>
              <td className="px-4 py-3 font-medium text-brand">{row.team.name}</td>
              <td className="px-4 py-3 text-muted">{row.played}</td>
              <td className="px-4 py-3 text-muted">{row.goalDifference}</td>
              <td className="px-4 py-3 font-semibold text-accent">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
