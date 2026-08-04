import { formatMoney } from "@/lib/format";
import type { Profile } from "@/lib/types";

export interface ShareBarRow {
  profile: Profile;
  value: number;
}

export function ShareBars({ title, rows }: { title: string; rows: ShareBarRow[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  const sorted = [...rows].sort((a, b) => b.value - a.value);

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium text-muted">{title}</h3>
      <div className="flex flex-col gap-2.5">
        {sorted.map(({ profile, value }) => (
          <div key={profile.id} className="flex items-center gap-3">
            <span className="flex w-24 shrink-0 items-center gap-1.5 truncate text-sm text-foreground">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: profile.highlight_color }}
                aria-hidden
              />
              {profile.full_name || profile.email}
            </span>
            <div className="h-4 min-w-0 flex-1 rounded-r bg-surface" title={formatMoney(value)}>
              <div
                className="h-4 rounded-r"
                style={{ width: `${(value / max) * 100}%`, backgroundColor: profile.highlight_color }}
              />
            </div>
            <span className="w-24 shrink-0 text-right text-sm text-foreground">{formatMoney(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
