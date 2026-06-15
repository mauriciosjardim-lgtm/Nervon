import {
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  Search,
  Sparkles,
  XCircle,
} from "lucide-react";
import type { EtapaJornada } from "@/lib/hooks/useComercial";
import { cn } from "@/lib/utils";

const icons = {
  novo: Sparkles,
  diagnostico: Search,
  reuniao: CalendarDays,
  proposta: FileText,
  negociacao: Handshake,
  fechado: CheckCircle2,
  perdido: XCircle,
} satisfies Record<EtapaJornada, typeof Sparkles>;

export function EtapaIcon({ etapa, className }: { etapa: EtapaJornada; className?: string }) {
  const Icon = icons[etapa];
  return <Icon className={cn("shrink-0 text-primary", className)} />;
}