import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  Navigate,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, useState, lazy, Suspense, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { applyBrandColor } from "@/lib/brandColor";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/lib/auth";
import { getSessionHint } from "@/lib/sessionHint";
import { MODULO_ROTA, temAcesso, type Permissoes } from "@/lib/permissoes";

const LandingPage = lazy(() =>
  import("@/components/landing/landing-page").then((m) => ({ default: m.LandingPage })),
);

const AuthShell = lazy(() =>
  import("@/components/auth-shell").then((m) => ({ default: m.AuthShell })),
);

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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
          >
            Voltar ao Cockpit
          </Link>
        </div>
      </div>
    </div>
  );
}

// Erros de carregamento de chunk (hash desatualizado após deploy) → recarrega 1x
function isChunkLoadError(error: Error): boolean {
  const m = `${error?.message ?? ""} ${error?.name ?? ""}`.toLowerCase();
  return (
    m.includes("dynamically imported module") ||
    m.includes("failed to fetch dynamically imported") ||
    m.includes("importing a module script failed") ||
    m.includes("error loading dynamically imported") ||
    m.includes("chunkloaderror") ||
    m.includes("'text/html' is not a valid javascript")
  );
}

function MakersHubUpdatedScreen({ manualReload = false }: { manualReload?: boolean }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background px-4"
      role="status"
      aria-live="polite"
    >
      <div className="w-full max-w-md rounded-2xl border border-primary/20 bg-surface-1/80 p-7 text-center shadow-[0_0_60px_-28px_var(--primary)]">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl border border-primary/25 bg-primary/10">
          <div className="size-5 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          Atualizamos o MakersHub
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Uma nova versão está pronta. Estamos carregando as melhorias para você.
        </p>

        {manualReload ? (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary-glow"
          >
            Carregar nova versão
          </button>
        ) : (
          <p className="mt-5 text-xs font-medium text-primary">Carregando nova versão…</p>
        )}
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const chunkError = isChunkLoadError(error);

  useEffect(() => {
    if (chunkError) {
      if (!sessionStorage.getItem("mh_chunk_reload")) {
        sessionStorage.setItem("mh_chunk_reload", String(Date.now()));
        const reload = window.setTimeout(() => window.location.reload(), 1400);
        return () => window.clearTimeout(reload);
      }
      return;
    }
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error, chunkError]);

  if (chunkError) {
    return (
      <MakersHubUpdatedScreen manualReload={Boolean(sessionStorage.getItem("mh_chunk_reload"))} />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tente novamente ou volte para o cockpit.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-glow"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-border bg-surface-1 px-4 py-2 text-sm font-medium hover:bg-surface-2"
          >
            Cockpit
          </a>
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
      {
        name: "description",
        content:
          "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub.",
      },
      { name: "theme-color", content: "#0a0a0a" },
      {
        property: "og:title",
        content: "MakersHub — O Hub Completo para Produtoras de Audiovisual",
      },
      {
        property: "og:description",
        content:
          "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "MakersHub — O Hub Completo para Produtoras de Audiovisual",
      },
      {
        name: "twitter:description",
        content:
          "MakersHub centraliza CRM, propostas, contratos, projetos, agenda e financeiro da sua produtora audiovisual em um único hub.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c09fe081-0f6c-4b62-8b4c-fc40cb15872a/id-preview-eb58ae41--539069a7-70fd-4ddd-927b-677bb0426890.lovable.app-1781488459803.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c09fe081-0f6c-4b62-8b4c-fc40cb15872a/id-preview-eb58ae41--539069a7-70fd-4ddd-927b-677bb0426890.lovable.app-1781488459803.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Aquece a conexão com o Supabase (auth + dados) — economiza o DNS+TLS
      // da primeira chamada, que é caro em rede móvel.
      {
        rel: "preconnect",
        href: "https://smsqhbbbyjacatxvihks.supabase.co",
        crossOrigin: "anonymous",
      },
      { rel: "dns-prefetch", href: "https://smsqhbbbyjacatxvihks.supabase.co" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
    ],
    scripts: [
      {
        // Carrega Google Fonts de forma não-bloqueante — não trava o primeiro paint
        children: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Inter:ital,opsz,wght@0,14..32,300..800;1,14..32,300..700&family=Inter+Tight:ital,wght@0,300..800;1,300..700&display=swap';document.head.appendChild(l);})();`,
      },
    ],
  }),
  // Dica de sessão (cookie mh_s) lida NO SERVIDOR pela API oficial (getCookie
  // via server fn) e serializada com o loader data — SSR e primeira renderização
  // do cliente enxergam o mesmo valor, sem localStorage/document.cookie no render.
  loader: async () => {
    try {
      return { sessionHint: await getSessionHint() };
    } catch (err) {
      console.warn("[root] falha ao ler dica de sessão; tratando como visitante:", err);
      return { sessionHint: false };
    }
  },
  // a dica só importa para a PRIMEIRA renderização; navegações não precisam reler
  staleTime: Infinity,
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
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

const PUBLIC_PATHS = ["/login", "/onboarding", "/convite", "/checkout"];
const ALWAYS_PUBLIC = ["/home", "/lp", "/aceitar-convite", "/auth/callback", "/auth/reset", "/termos", "/privacidade"]; // acessível com ou sem login

function AppShell() {
  const { session, usuario, loading, empresa } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [preloadRecovery, setPreloadRecovery] = useState<"auto" | "manual" | null>(null);
  const isPublic = PUBLIC_PATHS.includes(pathname);
  const isAlwaysPublic = ALWAYS_PUBLIC.includes(pathname) || pathname.startsWith("/p/");
  // dica de sessão lida no servidor (cookie mh_s) e serializada no loader —
  // idêntica no SSR e na primeira renderização do cliente (sem hidratação divergente)
  const { sessionHint } = Route.useLoaderData();

  // Recarrega automaticamente quando um chunk fica desatualizado após deploy.
  // Mantém a trava por alguns segundos após a recarga para evitar loop caso o
  // asset novo ainda não tenha propagado. Depois disso, uma atualização futura
  // volta a poder acionar a recuperação automática.
  useEffect(() => {
    let reloadTimer: number | undefined;
    const clearReloadLock = window.setTimeout(() => {
      sessionStorage.removeItem("mh_chunk_reload");
    }, 15_000);
    const onPreloadError = (event: Event) => {
      event.preventDefault();
      if (sessionStorage.getItem("mh_chunk_reload")) {
        setPreloadRecovery("manual");
        return;
      }
      sessionStorage.setItem("mh_chunk_reload", String(Date.now()));
      setPreloadRecovery("auto");
      reloadTimer = window.setTimeout(() => window.location.reload(), 1400);
    };
    window.addEventListener("vite:preloadError", onPreloadError);
    return () => {
      if (reloadTimer) window.clearTimeout(reloadTimer);
      window.clearTimeout(clearReloadLock);
      window.removeEventListener("vite:preloadError", onPreloadError);
    };
  }, []);

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

  const trialExpirado = (() => {
    if (!empresa?.trial_expires_at) return false;
    const d = new Date(empresa.trial_expires_at);
    return !isNaN(d.getTime()) && d < new Date();
  })();

  const sidebarStyle = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3.25rem",
  } as React.CSSProperties;
  const Spinner = (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );

  if (preloadRecovery) {
    return <MakersHubUpdatedScreen manualReload={preloadRecovery === "manual"} />;
  }

  // Rotas sempre públicas (landing pages, convites, callback OAuth) renderizam
  // direto, com ou sem sessão — /auth/callback precisa funcionar sem sessão.
  if (isAlwaysPublic) return <Outlet />;

  // Auth ainda resolvendo (SSR e primeira renderização do cliente caem aqui):
  if (loading) {
    // dica de sessão presente → shell neutro em QUALQUER rota (inclusive /login):
    // nada de landing, Dashboard vazia ou flash de formulário antes da confirmação
    if (sessionHint) return Spinner;
    // sem dica → visitante: rotas públicas e landing saem já no SSR
    if (isPublic) return <Outlet />;
    if (pathname === "/")
      return (
        <Suspense fallback={Spinner}>
          <LandingPage />
        </Suspense>
      );
    // rota privada sem dica: shell neutro até resolver (nunca conteúdo privado)
    return Spinner;
  }

  // ── Sessão resolvida: guards declarativos em render-time (sem useEffect) ──

  // Autenticado sem perfil → onboarding (a própria /onboarding renderiza direto)
  if (session && !usuario) {
    if (pathname !== "/onboarding") return <Navigate to="/onboarding" replace />;
    return <Outlet />;
  }

  if (session && usuario) {
    // autenticado em rota pública (login/onboarding/convite/checkout) → app
    if (isPublic) return <Navigate to="/" replace />;

    // Guard de permissões para membros (declarativo, sem flash do módulo)
    const role = (usuario as any).role ?? "admin";
    if (role !== "admin") {
      const permissoes = (usuario as any).permissoes as Partial<Permissoes> | null;
      for (const [modulo, rota] of Object.entries(MODULO_ROTA)) {
        if (pathname.startsWith(rota) && !temAcesso(permissoes, modulo as keyof Permissoes)) {
          return <Navigate to="/" replace />;
        }
      }
    }

    return (
      <Suspense fallback={Spinner}>
        <AuthShell trialExpirado={trialExpirado} sidebarStyle={sidebarStyle} />
      </Suspense>
    );
  }

  // Sem sessão: landing na raiz, rotas públicas direto, resto → login
  if (pathname === "/")
    return (
      <Suspense fallback={Spinner}>
        <LandingPage />
      </Suspense>
    );
  if (isPublic) return <Outlet />;
  return <Navigate to="/login" replace />;
}
