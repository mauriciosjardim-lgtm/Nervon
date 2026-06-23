import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useNavigate, useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { applyBrandColor } from "@/lib/brandColor";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { TrialExpirado } from "@/components/trial-expirado";
import { LandingPage } from "@/components/landing/landing-page";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O caminho que você procura não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow">
            Voltar ao Cockpit
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">Tente novamente ou volte para o cockpit.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow">Tentar novamente</button>
          <a href="/" className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium hover:bg-surface-2">Cockpit</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MakersHub — O Hub Completo para Produtoras de Audiovisual" },
      { name: "description", content: "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub." },
      { name: "theme-color", content: "#0a0a0a" },
      { property: "og:title", content: "MakersHub — O Hub Completo para Produtoras de Audiovisual" },
      { property: "og:description", content: "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MakersHub — O Hub Completo para Produtoras de Audiovisual" },
      { name: "twitter:description", content: "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c09fe081-0f6c-4b62-8b4c-fc40cb15872a/id-preview-eb58ae41--539069a7-70fd-4ddd-927b-677bb0426890.lovable.app-1781488459803.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c09fe081-0f6c-4b62-8b4c-fc40cb15872a/id-preview-eb58ae41--539069a7-70fd-4ddd-927b-677bb0426890.lovable.app-1781488459803.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..700&family=Inter+Tight:ital,wght@0,300..800;1,300..700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

const PUBLIC_PATHS = ["/login", "/onboarding"];
const ALWAYS_PUBLIC = ["/home"]; // acessível com ou sem login

function AppShell() {
  const { session, usuario, loading, empresa } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: s => s.location.pathname });
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAlwaysPublic = ALWAYS_PUBLIC.includes(pathname);

  // Aplica accent color da empresa ao carregar
  useEffect(() => {
    if (empresa?.accent_color) applyBrandColor(empresa.accent_color);
  }, [empresa?.accent_color]);

  // CTA da landing ("Entrar" / "Começar grátis") → tela de login
  useEffect(() => {
    const open = () => navigate({ to: "/login" });
    window.addEventListener("makershub:open-auth", open);
    return () => window.removeEventListener("makershub:open-auth", open);
  }, []);

  // Redireciona usuários não autenticados para login (exceto "/" deslogado, que mostra a landing)
  useEffect(() => {
    if (loading) return;
    if (isAlwaysPublic) return;
    if (!session && !isPublic && pathname !== "/") navigate({ to: "/login" });
    if (session && !usuario && pathname !== "/onboarding") navigate({ to: "/onboarding" });
    if (session && usuario && isPublic) navigate({ to: "/" });
  }, [loading, session, usuario, isPublic, isAlwaysPublic, pathname]);

  const trialExpirado = empresa?.trial_expires_at
    ? new Date(empresa.trial_expires_at) < new Date()
    : false;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Visitante deslogado na raiz → landing page de marketing
  if (!session && pathname === "/") return <LandingPage />;

  if (isAlwaysPublic) return <Outlet />;

  if (isPublic) return <Outlet />;

  if (trialExpirado) return <TrialExpirado />;

  return (
    <SidebarProvider style={{ "--sidebar-width": "15rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties}>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen w-full flex-col">
        <Topbar />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
