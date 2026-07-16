import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "iconsax-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function localValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({ value, onChange, placeholder = "Selecionar data e hora", hideTime = false, onlyTime = false }: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hideTime?: boolean;
  onlyTime?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => value ? new Date(value) : undefined, [value]);
  const valido = selected && !Number.isNaN(selected.getTime()) ? selected : undefined;
  const hora = valido ? format(valido, "HH:mm") : "10:00";

  const selecionarDia = (dia?: Date) => {
    if (!dia) return;
    const [h, m] = hora.split(":").map(Number);
    dia.setHours(h, m, 0, 0);
    onChange(localValue(dia));
    setOpen(false);
  };

  const alterarHora = (novaHora: string) => {
    const base = valido ? new Date(valido) : new Date();
    const [h, m] = novaHora.split(":").map(Number);
    base.setHours(h, m, 0, 0);
    onChange(localValue(base));
  };

  if (onlyTime) return <label className="flex h-9 items-center gap-2 rounded-md border border-input px-2.5 transition focus-within:border-primary/40"><Clock size={14} color="currentColor" className="shrink-0 text-primary" /><input type="time" value={hora} onChange={e => alterarHora(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none [color-scheme:dark]" /></label>;
  return <div className={cn("grid gap-2", hideTime ? "grid-cols-1" : "grid-cols-[minmax(0,1fr)_104px]")}>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn("flex h-9 items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm transition hover:border-primary/35", !valido && "text-muted-foreground")}>
          <CalendarIcon size={15} color="currentColor" className="shrink-0 text-primary" />
          <span className="truncate">{valido ? format(valido, "dd MMM yyyy", { locale: ptBR }) : placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden rounded-xl border-border/70 bg-popover p-0 shadow-2xl">
        <Calendar mode="single" selected={valido} onSelect={selecionarDia} locale={ptBR} initialFocus />
        <div className="flex items-center justify-between border-t border-border/60 px-3 py-2">
          <span className="text-[10px] text-muted-foreground">Escolha o dia</span>
          {value && <button type="button" onClick={() => { onChange(""); setOpen(false); }} className="text-[10px] text-primary">Limpar</button>}
        </div>
      </PopoverContent>
    </Popover>
    {!hideTime && <label className="flex h-9 items-center gap-2 rounded-md border border-input px-2.5 transition focus-within:border-primary/40">
      <Clock size={14} color="currentColor" className="shrink-0 text-primary" />
      <input type="time" value={hora} onChange={e => alterarHora(e.target.value)} className="min-w-0 flex-1 bg-transparent text-xs outline-none [color-scheme:dark]" />
    </label>}
  </div>;
}
