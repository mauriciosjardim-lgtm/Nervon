import { Link, useRouterState } from "@tanstack/react-router";
import { Element3, MagicStar, Buildings2, Profile2User, Notification, Calendar } from "iconsax-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/comercial", label: "Jornada", icon: Element3, exact: true },
  { to: "/comercial/leads", label: "Leads", icon: MagicStar },
  { to: "/comercial/empresas", label: "Empresas", icon: Buildings2 },
  { to: "/comercial/contatos", label: "Contatos", icon: Profile2User },
  { to: "/comercial/followups", label: "Follow-ups", icon: Notification },
  { to: "/comercial/agenda", label: "Agenda Comercial", icon: Calendar },
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
            <Icon size={14} color="currentColor" variant="Linear" className="text-primary" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
