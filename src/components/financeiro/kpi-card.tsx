import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function KpiCard({
  icon: Icon, label, value, hint, tone = "default", className, onClick, hintOnClick,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "positive" | "negative" | "warning";
  className?: string;
  onClick?: () => void;
  hintOnClick?: () => void;
}) {
  const toneClass =
    tone === "positive" ? "text-success" :
    tone === "negative" ? "text-destructive" :
    tone === "warning" ? "text-warning" : "text-foreground";

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-surface-1/60 p-4 transition hover:bg-surface-1",
        onClick && "cursor-pointer hover:border-primary/40 hover:shadow-[0_0_0_1px_var(--primary)/15]",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <span className="grid size-7 place-items-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
          <Icon className="size-3.5 text-primary" />
        </span>
      </div>
      <p className={cn("mt-3 font-display text-2xl font-semibold tabular-nums tracking-tight", toneClass)}>{value}</p>
      {hint && (
        hintOnClick ? (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); hintOnClick(); }}
            className="mt-1 text-left text-xs text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
          >
            {hint}
          </button>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
        )
      )}
    </div>
  );
}
