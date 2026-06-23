import { cn } from "@/lib/utils";
import { STATUS_META, type LancStatus } from "@/lib/mock/financeiro";
import { Danger, Clock, TickCircle } from "iconsax-react";

export function StatusBadge({ status, className }: { status: LancStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        meta.bg, meta.border, meta.color, className,
      )}
    >
      {status === "atrasado"
        ? <Danger size={12} color="currentColor" variant="Linear" />
        : status === "previsto"
          ? <Clock size={12} color="currentColor" variant="Linear" />
          : <TickCircle size={12} color="currentColor" variant="Linear" />}
      {meta.label}
    </span>
  );
}
