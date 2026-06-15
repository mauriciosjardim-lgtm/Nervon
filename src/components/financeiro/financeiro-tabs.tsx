import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, ArrowLeftRight, CalendarClock, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/financeiro", label: "Visão geral", icon: LayoutGrid, exact: true },
  { to: "/financeiro/lancamentos", label: "Lançamentos", icon: ArrowLeftRight },
  { to: "/financeiro/contas", label: "Contas", icon: CalendarClock },
  { to: "/financeiro/projetos", label: "Por projeto", icon: FolderKanban },
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
            <Icon className="size-3.5 text-primary" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
