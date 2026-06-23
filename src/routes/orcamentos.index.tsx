import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator } from "lucide-react";
import { MagicStar, Trash, Timer, SliderHorizontal } from "iconsax-react";
import { TipoCard } from "@/components/orcamentos/tipo-card";
import { PrecosModal } from "@/components/orcamentos/precos-modal";
import { Button } from "@/components/ui/button";
import { TIPOS_ORCAMENTO, TIPO_ICONS, fmtBRL, type TipoOrcamento } from "@/lib/mock/orcamentos";
import { useOrcamentos, orcamentosActions } from "@/lib/hooks/useOrcamentos";

export const Route = createFileRoute("/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos — MakersHub" }] }),
  component: OrcamentosIndex,
});

const TIPOS_LISTA: TipoOrcamento[] = ["institucional", "mensal", "podcast", "captacao", "edicao", "fotografia", "custom"];

function OrcamentosIndex() {
  const { orcamentos, templates: todosTemplates } = useOrcamentos();
  // Por enquanto só o tipo personalizado está ativo — esconde templates de tipos ainda não liberados.
  const templates = todosTemplates.filter(t => t.tipo === "custom");
  const [precosOpen, setPrecosOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-[1280px] px-5 py-7 md:px-8 md:py-10">
      <div className="mb-4 flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setPrecosOpen(true)} className="gap-1.5">
          <SliderHorizontal size={14} color="currentColor" variant="Linear" /> Configuração de preços
        </Button>
      </div>

      <header className="mb-10 text-center">
        <p className="flex items-center justify-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Calculator className="size-3.5 text-primary" /> Orçamentos inteligentes
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
          O que você deseja orçar hoje?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Responda algumas perguntas e o MakersHub calcula custo, preço e lucro automaticamente.
        </p>
      </header>

      <PrecosModal open={precosOpen} onOpenChange={setPrecosOpen} />

      <section>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {TIPOS_LISTA.map(t => <TipoCard key={t} tipo={t} disabled={t !== "custom"} />)}
        </div>
      </section>

      {templates.length > 0 && (
        <section className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <MagicStar size={16} color="currentColor" variant="Linear" className="text-primary" />
            <h2 className="font-display text-lg font-semibold tracking-tight">Templates</h2>
            <p className="text-xs text-muted-foreground">Comece de um modelo pronto.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {templates.map(tpl => {
              const Icon = TIPO_ICONS[tpl.tipo];
              return (
                <Link
                  key={tpl.id}
                  to="/orcamentos/novo"
                  search={{ tipo: tpl.tipo, template: tpl.id }}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-surface-1/40 p-4 transition hover:border-primary/40 hover:bg-surface-1"
                >
                  <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20"><Icon className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tpl.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{TIPOS_ORCAMENTO[tpl.tipo].label}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="mb-4 flex items-center gap-2">
          <Timer size={16} color="currentColor" variant="Linear" className="text-muted-foreground" />
          <h2 className="font-display text-lg font-semibold tracking-tight">Orçamentos recentes</h2>
        </div>
        {orcamentos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-surface-1/30 p-10 text-center">
            <p className="text-sm text-muted-foreground">Nenhum orçamento criado ainda. Escolha um tipo acima para começar.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {orcamentos.map(o => {
              const Icon = TIPO_ICONS[o.tipo];
              return (
              <div key={o.id} className="group flex items-center gap-4 rounded-xl border border-border/60 bg-surface-1/40 p-4 transition hover:border-primary/30">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20"><Icon className="size-5" /></span>
                <Link to="/orcamentos/$id" params={{ id: o.id }} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{o.geral.nomeProjeto || "Sem nome"}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.geral.cliente || "—"} · {new Date(o.criadoEm).toLocaleDateString("pt-BR")}</p>
                </Link>
                <div className="text-right">
                  <p className="font-display text-base font-semibold tabular-nums text-primary">{fmtBRL(o.calculo.precoSugerido)}</p>
                  <p className="text-[11px] text-muted-foreground">margem {o.calculo.margem}%</p>
                </div>
                <button onClick={() => orcamentosActions.remover(o.id)} className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100">
                  <Trash size={16} color="currentColor" variant="Linear" />
                </button>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
