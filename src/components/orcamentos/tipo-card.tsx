import { Link } from "@tanstack/react-router";
import { TIPOS_ORCAMENTO, TIPO_ICONS, type TipoOrcamento } from "@/lib/mock/orcamentos";
import { cn } from "@/lib/utils";

export function TipoCard({ tipo, className }: { tipo: TipoOrcamento; className?: string }) {
  const t = TIPOS_ORCAMENTO[tipo];
  const Icon = TIPO_ICONS[tipo];
  return (
    <Link
      to="/orcamentos/novo"
      search={{ tipo }}
      className={cn(
        "group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border/60 bg-surface-1/60 p-5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-surface-1 hover:shadow-[0_8px_32px_-12px_var(--primary)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "var(--gradient-glow)" }} />
      <div className="relative grid size-12 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 transition-transform duration-300 group-hover:scale-110">
        <Icon className="size-5" />
      </div>
      <div className="relative">
        <h3 className="font-display text-base font-semibold tracking-tight">{t.label}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t.descricao}</p>
      </div>
      <span className="relative mt-auto text-[11px] font-medium uppercase tracking-wider text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Iniciar →
      </span>
    </Link>
  );
}
