import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Sparkles, Building2, Users, Bell, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/comercial", label: "Jornada", icon: LayoutGrid, exact: true },
  { to: "/comercial/leads", label: "Leads", icon: Sparkles },
  { to: "/comercial/empresas", label: "Empresas", icon: Building2 },
  { to: "/comercial/contatos", label: "Contatos", icon: Users },
  { to: "/comercial/followups", label: "Follow-ups", icon: Bell },
  { to: "/comercial/agenda", label: "Agenda Comercial", icon: CalendarDays },
];

export function ComercialTabs() {
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
