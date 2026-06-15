import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function CampoToggle({
  label, hint, value, onChange, icone,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
  icone?: string;
}) {
  return (
    <button
      type="button" onClick={() => onChange(!value)}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all",
        value
          ? "border-primary/50 bg-primary/5 shadow-[0_0_24px_-12px_var(--primary)]"
          : "border-border/60 bg-surface-1/40 hover:border-primary/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {icone && <span className={cn("grid size-9 place-items-center rounded-lg text-lg transition", value ? "bg-primary/15 ring-1 ring-primary/30" : "bg-surface-2 text-muted-foreground")}>{icone}</span>}
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className={cn(
        "grid size-6 shrink-0 place-items-center rounded-md border transition",
        value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background/40",
      )}>
        {value && <Check className="size-3.5" />}
      </div>
    </button>
  );
}
