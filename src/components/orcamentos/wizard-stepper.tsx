import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function WizardStepper({
  steps, current, onJump,
}: { steps: { id: number; label: string }[]; current: number; onJump?: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2">
      {steps.map((s, i) => {
        const done = current > s.id;
        const active = current === s.id;
        return (
          <li key={s.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!onJump || s.id > current}
              onClick={() => onJump?.(s.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active && "border-primary bg-primary/10 text-primary shadow-[0_0_20px_-8px_var(--primary)]",
                done && "border-success/40 bg-success/10 text-success",
                !active && !done && "border-border/60 bg-surface-1/40 text-muted-foreground",
                onJump && s.id <= current && "cursor-pointer hover:border-primary/40",
              )}
            >
              <span className={cn(
                "grid size-5 place-items-center rounded-full text-[10px] font-bold",
                active && "bg-primary text-primary-foreground",
                done && "bg-success text-background",
                !active && !done && "bg-surface-2",
              )}>
                {done ? <Check className="size-3" /> : s.id + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className={cn("h-px flex-1 transition", current > s.id ? "bg-success/40" : "bg-border/60")} />}
          </li>
        );
      })}
    </ol>
  );
}
