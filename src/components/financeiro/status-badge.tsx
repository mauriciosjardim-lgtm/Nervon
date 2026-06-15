import { cn } from "@/lib/utils";
import { STATUS_META, type LancStatus } from "@/lib/mock/financeiro";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";

export function StatusBadge({ status, className }: { status: LancStatus; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = status === "atrasado" ? AlertTriangle : status === "previsto" ? Clock : CheckCircle2;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        meta.bg, meta.border, meta.color, className,
      )}
    >
      <Icon className="size-3" />
      {meta.label}
    </span>
  );
}
