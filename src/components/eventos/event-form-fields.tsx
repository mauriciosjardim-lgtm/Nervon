import { Clock3 } from "lucide-react";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { cn } from "@/lib/utils";

export function EventoDateField({ value, onChange, placeholder = "Selecionar data" }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return <DateTimePicker hideTime value={value ? `${value}T12:00` : ""} onChange={v => onChange(v ? v.slice(0, 10) : "")} placeholder={placeholder} />;
}

function maskTime(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

function normalizeTime(value: string) {
  const [hRaw = "0", mRaw = "0"] = value.split(":");
  const h = Math.min(23, Math.max(0, Number(hRaw) || 0));
  const m = Math.min(59, Math.max(0, Number(mRaw) || 0));
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function EventoTimeField({ value, onChange, placeholder = "00:00", className }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string }) {
  return <label className={cn("flex h-10 items-center gap-2 rounded-md border border-input bg-background/35 px-3 transition focus-within:border-primary/45 focus-within:ring-1 focus-within:ring-primary/15", className)}><Clock3 className="size-3.5 shrink-0 text-primary" /><input value={value} inputMode="numeric" maxLength={5} placeholder={placeholder} onChange={e => onChange(maskTime(e.target.value))} onBlur={() => value && onChange(normalizeTime(value))} className="min-w-0 flex-1 bg-transparent font-mono text-sm tabular-nums outline-none placeholder:font-sans placeholder:text-muted-foreground" /></label>;
}
