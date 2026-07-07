import { Link, useRouterState } from "@tanstack/react-router";
import {
  Element3,
  Briefcase,
  Kanban,
  Calendar,
  EmptyWallet,
  ClipboardText,
  DocumentText1,
  Calculator,
  Archive,
  StatusUp,
  Flash,
  Setting2,
  Logout,
} from "iconsax-react";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { Icon } from "iconsax-react";
import { temAcesso, type Permissoes } from "@/lib/permissoes";
import { cn } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: Icon; modulo?: keyof Permissoes };
type SoonItem = { title: string; icon: Icon };

const DASHBOARD_URL = import.meta.env.DEV ? "/dashboard-v3" : "/";

const primary: NavItem[] = [
  { title: "Dashboard", url: DASHBOARD_URL, icon: Element3 },
  { title: "Comercial", url: "/comercial", icon: Briefcase, modulo: "comercial" },
  { title: "Projetos", url: "/projetos", icon: Kanban, modulo: "projetos" },
  { title: "Agenda", url: "/agenda", icon: Calendar, modulo: "agenda" },
  { title: "Financeiro", url: "/financeiro", icon: EmptyWallet, modulo: "financeiro" },
];

const comingSoon: SoonItem[] = [];

const tools: NavItem[] = [
  { title: "Propostas", url: "/propostas", icon: ClipboardText, modulo: "propostas" },
  { title: "Orçamentos", url: "/orcamentos", icon: Calculator, modulo: "orcamentos" },
  { title: "Contratos", url: "/contratos", icon: DocumentText1, modulo: "contratos" },
  { title: "Performance", url: "/performance", icon: StatusUp, modulo: "performance" },
];

const toolsSoon: SoonItem[] = [{ title: "Recursos", icon: Archive }];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (url: string) => (url === "/" ? pathname === "/" : pathname.startsWith(url));
  const { empresa, usuario, signOut } = useAuth();

  const previewV3 = import.meta.env.DEV && pathname.startsWith("/dashboard-v3");
  const iconProps = (active = false) => ({
    size: previewV3 ? 17 : 16,
    color: "currentColor",
    variant: active && previewV3 ? ("Bold" as const) : ("Linear" as const),
  });

  const role = (usuario as any)?.role ?? "admin";
  const permissoes = ((usuario as any)?.permissoes as Partial<Permissoes> | null) ?? null;
  const podeVer = (item: NavItem) =>
    role === "admin" || !item.modulo || temAcesso(permissoes, item.modulo);

  return (
    <Sidebar
      collapsible="icon"
      className={cn(
        "border-r border-sidebar-border",
        previewV3 && "[font-family:'IBM_Plex_Sans',Inter,system-ui,sans-serif]",
      )}
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_20px_-2px_var(--primary)] overflow-hidden">
            {empresa?.logo_url ? (
              <img src={empresa.logo_url} alt="logo" className="h-full w-full object-contain" />
            ) : (
              <>
                <span className="font-display text-sm font-bold">
                  {empresa?.nome?.[0]?.toUpperCase() ?? "N"}
                </span>
                <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
              </>
            )}
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-display text-[15px] font-semibold tracking-tight">
                {empresa?.nome ?? "MakersHub"}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              Operação
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {primary.filter(podeVer).map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="group/item h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary data-[active=true]:font-medium"
                  >
                    <Link to={item.url}>
                      <item.icon {...iconProps(isActive(item.url))} />
                      <span>{item.title}</span>
                      {isActive(item.url) && (
                        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {comingSoon.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={`${item.title} — Em breve`}
                    className="h-9 cursor-not-allowed opacity-40 hover:bg-transparent"
                  >
                    <item.icon {...iconProps()} />
                    <span>{item.title}</span>
                    {!collapsed && (
                      <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        Em breve
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              Ferramentas
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.filter(podeVer).map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                    className="h-9 data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-primary"
                  >
                    <Link to={item.url}>
                      <item.icon {...iconProps(isActive(item.url))} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {toolsSoon.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={`${item.title} — Em breve`}
                    className="h-9 cursor-not-allowed opacity-40 hover:bg-transparent"
                  >
                    <item.icon {...iconProps()} />
                    <span>{item.title}</span>
                    {!collapsed && (
                      <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                        Em breve
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground/70">
              Inteligência
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="MakersHub Intelligence — Em breve"
                  className="h-9 cursor-not-allowed opacity-50 hover:bg-transparent"
                >
                  <Flash {...iconProps()} />
                  <span>Intelligence</span>
                  {!collapsed && (
                    <span className="ml-auto rounded-md border border-border bg-surface-2 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-muted-foreground">
                      Em breve
                    </span>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-1.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/configuracoes")}
              tooltip="Configurações"
              className="h-9 data-[active=true]:bg-sidebar-accent"
            >
              <Link to="/configuracoes">
                <Setting2 {...iconProps(isActive("/configuracoes"))} />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {!collapsed && (
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-2">
            <Link
              to="/configuracoes"
              className="flex min-w-0 flex-1 items-center gap-2 transition hover:opacity-80"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-primary to-primary-glow text-[11px] font-bold text-primary-foreground">
                {(usuario?.nome ?? "VC")
                  .split(" ")
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-xs font-medium">{usuario?.nome ?? "Você"}</p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {usuario?.cargo ?? "Plano Studio"}
                </p>
              </div>
            </Link>
            <button
              onClick={signOut}
              title="Sair"
              className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition hover:text-destructive"
            >
              <Logout size={14} color="currentColor" variant="Linear" />
            </button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
