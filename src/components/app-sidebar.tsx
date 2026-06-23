import { Link, useRouterState } from "@tanstack/react-router";
import {
  Element3, Briefcase, Kanban, Calendar, EmptyWallet,
  ClipboardText, DocumentText1, Calculator, Archive, StatusUp,
  Flash, Setting2, Logout,
} from "iconsax-react";
import { useAuth } from "@/lib/auth";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Icon } from "iconsax-react";

type NavItem = { title: string; url: string; icon: Icon };
type SoonItem = { title: string; icon: Icon };

const primary: NavItem[] = [
  { title: "Dashboard",  url: "/",          icon: Element3    },
  { title: "Comercial",  url: "/comercial",  icon: Briefcase   },
  { title: "Projetos",   url: "/projetos",   icon: Kanban      },
  { title: "Agenda",     url: "/agenda",     icon: Calendar    },
  { title: "Financeiro", url: "/financeiro", icon: EmptyWallet },
];

const comingSoon: SoonItem[] = [
  { title: "Propostas",  icon: ClipboardText  },
  { title: "Contratos",  icon: DocumentText1  },
];

const tools: NavItem[] = [
  { title: "Orçamentos",   url: "/orcamentos",   icon: Calculator },
  { title: "Performance",  url: "/performance",  icon: StatusUp   },
];

const toolsSoon: SoonItem[] = [
  { title: "Recursos", icon: Archive },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: s => s.location.pathname });
  const isActive = (url: string) => url === "/" ? pathname === "/" : pathname.startsWith(url);
  const { empresa, usuario, signOut } = useAuth();

  const iconProps = { size: 16, color: "currentColor", variant: "Linear" as const };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-2px_var(--primary)] overflow-hidden">
            {empresa?.logo_url
              ? <img src={empresa.logo_url} alt="logo" className="h-full w-full object-contain" />
              : <><span className="font-display text-sm font-bold">{empresa?.nome?.[0]?.toUpperCase() ?? "N"}</span><span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" /></>
            }
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[15px] font-semibold tracking-tight">{empresa?.nome ?? "MakersHub"}</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Operação</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.map(item => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title} className="group/item h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-medium">
                    <Link to={item.url}>
                      <item.icon {...iconProps} />
                      <span>{item.title}</span>
                      {isActive(item.url) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {comingSoon.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={`${item.title} — Em breve`} className="h-9 cursor-not-allowed opacity-40 hover:bg-transparent">
                    <item.icon {...iconProps} />
                    <span>{item.title}</span>
                    {!collapsed && <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Em breve</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Ferramentas</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title} className="h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary">
                    <Link to={item.url}>
                      <item.icon {...iconProps} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {toolsSoon.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton tooltip={`${item.title} — Em breve`} className="h-9 cursor-not-allowed opacity-40 hover:bg-transparent">
                    <item.icon {...iconProps} />
                    <span>{item.title}</span>
                    {!collapsed && <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Em breve</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">Inteligência</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="MakersHub Intelligence — Em breve" className="h-9 cursor-not-allowed opacity-50 hover:bg-transparent">
                  <Flash {...iconProps} />
                  <span>Intelligence</span>
                  {!collapsed && <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">Em breve</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-1.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive("/configuracoes")} tooltip="Configurações" className="h-9 data-[active=true]:bg-sidebar-accent">
              <Link to="/configuracoes">
                <Setting2 {...iconProps} />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
            <Link to="/configuracoes" className="flex min-w-0 flex-1 items-center gap-2 transition hover:opacity-80">
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-[11px] font-bold text-primary-foreground">
                {(usuario?.nome ?? "VC").split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-medium">{usuario?.nome ?? "Você"}</p>
                <p className="truncate text-[10px] text-muted-foreground">{usuario?.cargo ?? "Plano Studio"}</p>
              </div>
            </Link>
            <button onClick={signOut} title="Sair" className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition hover:text-destructive">
              <Logout size={14} color="currentColor" variant="Linear" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
