import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampoNumero({
  label, hint, value, onChange, min = 0, max = 99, step = 1, sufixo, className,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  sufixo?: string;
  className?: string;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-surface-1/40 px-4 py-3 transition hover:border-primary/30", className)}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border/60 bg-background/40 p-1">
        <button
          type="button" onClick={() => set(value - step)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-surface-2 hover:text-foreground disabled:opacity-30"
          disabled={value <= min}
        >
          <Minus className="size-3.5" />
        </button>
        <div className="flex w-16 items-baseline justify-center gap-1">
          <span className="font-display text-base font-semibold tabular-nums">{value}</span>
          {sufixo && <span className="text-[10px] text-muted-foreground">{sufixo}</span>}
        </div>
        <button
          type="button" onClick={() => set(value + step)}
          className="grid size-7 place-items-center rounded-md text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
