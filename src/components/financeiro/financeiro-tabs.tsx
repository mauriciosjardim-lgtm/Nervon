import { Link, useRouterState } from "@tanstack/react-router";
import { Element3, ArrangeHorizontal, Calendar, Kanban } from "iconsax-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/financeiro", label: "Visão geral", icon: Element3, exact: true },
  { to: "/financeiro/lancamentos", label: "Lançamentos", icon: ArrangeHorizontal },
  { to: "/financeiro/contas", label: "Contas", icon: Calendar },
  { to: "/financeiro/projetos", label: "Por projeto", icon: Kanban },
];

export function FinanceiroTabs() {
  const pathname = useRouterState({ select: s => s.location.pathname });
  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-xl border border-border bg-surface-1/40 p-1">
      {tabs.map(t => {
        const active = t.exact ? pathname === t.to : pathname === t.to;
        const Icon = t.icon;
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-surface-3 text-foreground shadow-sm"
                : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            <Icon size={14} color="currentColor" variant="Linear" className="text-primary" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
