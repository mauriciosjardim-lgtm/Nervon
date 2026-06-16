import { Link } from "@tanstack/react-router";
import { Star, Users, ShoppingCart } from "lucide-react";
import { CATEGORIAS, CATEGORIA_ICONS, type CategoriaRecurso } from "@/lib/mock/biblioteca";

export function CategoriaCard({
  categoria, count, disabled, badge,
}: { categoria: CategoriaRecurso | "favoritos" | "compartilhados" | "marketplace"; count?: number; disabled?: boolean; badge?: string }) {
  const meta =
    categoria === "favoritos"      ? { label: "Favoritos",      Icon: Star,         descricao: "Seus modelos mais usados." } :
    categoria === "compartilhados" ? { label: "Compartilhados", Icon: Users,        descricao: "Visíveis para sua equipe." } :
    categoria === "marketplace"    ? { label: "Marketplace",    Icon: ShoppingCart, descricao: "Modelos prontos da comunidade." } :
    { ...CATEGORIAS[categoria], Icon: CATEGORIA_ICONS[categoria] };
  const Icon = meta.Icon;

  const to = categoria === "marketplace" ? undefined :
             categoria === "favoritos"   ? "/biblioteca/favoritos" :
             categoria === "compartilhados" ? "/biblioteca/compartilhados" :
             `/biblioteca/${categoria}`;

  const inner = (
    <div className={`group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border p-5 transition-all duration-300 ${disabled
      ? "cursor-not-allowed border-dashed border-border/50 bg-surface-1/20 opacity-60"
      : "border-border/60 bg-surface-1/60 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-surface-1 hover:shadow-[0_8px_32px_-12px_var(--primary)]"
    }`}>
      <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20"><Icon className="size-5" /></div>
      <div>
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-semibold tracking-tight">{meta.label}</h3>
          {badge && <span className="rounded-md border border-border/60 bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">{badge}</span>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{meta.descricao}</p>
      </div>
      {typeof count === "number" && (
        <p className="mt-auto text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {count} {count === 1 ? "item" : "itens"}
        </p>
      )}
    </div>
  );

  if (disabled || !to) return <div>{inner}</div>;
  return <Link to={to}>{inner}</Link>;
}
