import { useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  Eye,
  ExternalLink,
  KeyRound,
  PackageCheck,
  Play,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Projeto } from "@/lib/mock/projetos";
import { portalDisplayProgress, portalSlug } from "@/lib/portal-cliente";
import { cn } from "@/lib/utils";
import { ClientPortalProjectPanel } from "./client-portal-panel";
import { ClientPortalUsersPanel } from "./client-portal-users-panel";

type WorkspaceView = "status" | "approvals" | "deliveries" | "access";

const PUBLIC_PHASE_LABELS: Record<string, string> = {
  preparacao: "Preparação",
  planejamento: "Planejamento",
  producao: "Produção",
  editando: "Editando",
  aguardando_aprovacao: "Aguardando aprovação",
  ajustes: "Ajustes",
  aprovado: "Aprovado",
  entregue: "Entregue",
};

const NAVIGATION: Array<{
  id: WorkspaceView;
  label: string;
  description: string;
  icon: typeof Eye;
  tone: string;
}> = [
  {
    id: "status",
    label: "Visão do cliente",
    description: "Status e progresso",
    icon: Eye,
    tone: "text-primary",
  },
  {
    id: "approvals",
    label: "Aprovações",
    description: "Cortes para revisão",
    icon: Send,
    tone: "text-warning",
  },
  {
    id: "deliveries",
    label: "Entregas",
    description: "Materiais finais",
    icon: PackageCheck,
    tone: "text-success",
  },
  {
    id: "access",
    label: "Acessos",
    description: "Usuários e senhas",
    icon: KeyRound,
    tone: "text-[#66B8FF]",
  },
];

export function ClientPortalWorkspace({ project }: { project: Projeto }) {
  const [view, setView] = useState<WorkspaceView>("status");
  const phaseLabel = PUBLIC_PHASE_LABELS[project.portalPhase ?? "preparacao"] ?? "Preparação";
  const progress = portalDisplayProgress(project.portalProgress, project.portalPhase);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-surface-1/30 shadow-[0_24px_80px_-48px_rgba(0,0,0,.85)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden">
        <div className="absolute -left-24 -top-40 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-0 h-px w-2/3 bg-gradient-to-l from-primary/35 to-transparent" />
      </div>

      <header className="relative grid gap-6 border-b border-border/60 px-5 py-5 lg:grid-cols-[1fr_auto] lg:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_30px_-10px_hsl(var(--primary)/.7)]">
            <Play className="ml-0.5 size-5 fill-current" />
            <span className="absolute inset-x-2 bottom-1 h-px bg-primary/50" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
                Makers Members
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[8px] font-semibold uppercase tracking-wider",
                  project.portalVisible
                    ? "border-success/25 bg-success/10 text-success"
                    : "border-border/80 bg-background/30 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    project.portalVisible ? "bg-success" : "bg-muted-foreground/60",
                  )}
                />
                {project.portalVisible ? "Visível ao cliente" : "Portal oculto"}
              </span>
            </div>
            <h2 className="mt-2 truncate font-display text-xl font-semibold tracking-tight">
              Central do cliente
            </h2>
            <p className="mt-1 max-w-2xl text-[11px] leading-5 text-muted-foreground">
              Gerencie o que{" "}
              <strong className="font-medium text-foreground">{project.cliente}</strong> acompanha,
              aprova e recebe neste projeto.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-center">
          <div className="hidden min-w-36 border-r border-border/70 pr-4 text-right sm:block">
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Experiência publicada
            </p>
            <p className="mt-1 text-xs font-medium">{phaseLabel}</p>
            <div className="mt-2 ml-auto h-1 w-28 overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <a href={`/portal/${portalSlug(project.cliente)}`} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              Ver experiência
            </a>
          </Button>
        </div>
      </header>

      <nav
        className="relative flex overflow-x-auto border-b border-border/60 bg-background/15 sm:grid sm:grid-cols-2 lg:grid-cols-4"
        aria-label="Gestão da área do cliente"
      >
        {NAVIGATION.map((item, index) => {
          const Icon = item.icon;
          const selected = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setView(item.id)}
              className={cn(
                "group relative flex min-h-[76px] min-w-[176px] flex-1 items-center gap-3 border-r border-border/50 px-4 text-left transition-colors last:border-r-0 sm:min-w-0 sm:border-b sm:[&:nth-child(odd)]:border-r lg:border-b-0 lg:border-r lg:last:border-r-0",
                selected ? "bg-surface-2/70" : "hover:bg-surface-2/35",
              )}
            >
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl border transition",
                  selected
                    ? "border-current/20 bg-background/45 shadow-sm"
                    : "border-border/60 bg-background/20 text-muted-foreground",
                  selected && item.tone,
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "truncate text-[11px] font-semibold",
                      selected ? "text-foreground" : "text-foreground/80",
                    )}
                  >
                    {item.label}
                  </span>
                  {selected && <ChevronRight className={cn("size-3", item.tone)} />}
                </span>
                <span className="mt-1 block truncate text-[9px] text-muted-foreground">
                  {item.description}
                </span>
              </span>
              <span className="absolute right-3 top-3 text-[8px] font-medium text-muted-foreground/40">
                0{index + 1}
              </span>
              {selected && (
                <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="relative p-4 sm:p-5 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-1">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold">
              <Sparkles className="size-3.5 text-primary" />
              {NAVIGATION.find((item) => item.id === view)?.label}
            </p>
            <p className="mt-1 text-[9px] text-muted-foreground">
              {view === "status" &&
                "Controle exatamente a informação que aparece na página inicial do cliente."}
              {view === "approvals" &&
                "Envie versões para revisão e acompanhe as decisões sem sair do projeto."}
              {view === "deliveries" &&
                "Disponibilize links finais organizados, sem abrir uma nova aprovação."}
              {view === "access" && "Defina quem pode entrar no portal deste cliente."}
            </p>
          </div>
          {view === "status" && project.portalVisible && (
            <span className="inline-flex items-center gap-1.5 text-[9px] font-medium text-success">
              <CheckCircle2 className="size-3.5" />
              Portal publicado
            </span>
          )}
        </div>

        {view === "access" ? (
          <ClientPortalUsersPanel clientId={project.clienteId} clientName={project.cliente} />
        ) : (
          <ClientPortalProjectPanel project={project} showAccessBanner={false} view={view} />
        )}
      </div>
    </section>
  );
}
