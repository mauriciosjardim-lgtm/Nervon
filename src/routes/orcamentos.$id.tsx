import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, FileText, FolderPlus, Save } from "lucide-react";
import { getOrcamento, TIPOS_ORCAMENTO, fmtBRL, orcamentosActions } from "@/lib/mock/orcamentos";

export const Route = createFileRoute("/orcamentos/$id")({
  head: () => ({ meta: [{ title: "Orçamento — Nervon" }] }),
  component: OrcamentoView,
});

function OrcamentoView() {
  const { id } = Route.useParams();
  const o = getOrcamento(id);
  if (!o) throw notFound();

  const tipo = TIPOS_ORCAMENTO[o.tipo];

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 py-7 md:px-8 md:py-10">
      <Link to="/orcamentos" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-3.5" /> Voltar para orçamentos
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface-1/60 to-surface-1/30 p-8 shadow-[var(--shadow-elevated)]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" /> {tipo.icone} {tipo.label}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">{o.geral.nomeProjeto}</h1>
          <p className="text-sm text-muted-foreground">{o.geral.cliente} · Responsável: {o.geral.responsavel}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Big label="Custo operacional" value={fmtBRL(o.calculo.custoOperacional)} />
            <Big label="Margem" value={`${o.calculo.margem}%`} />
            <Big label="Preço sugerido" value={fmtBRL(o.calculo.precoSugerido)} primary />
            <Big label="Lucro estimado" value={fmtBRL(o.calculo.lucroEstimado)} success />
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        <Action icon={FileText} label="Gerar proposta" />
        <Action icon={Save} label="Salvar template" onClick={() => orcamentosActions.salvarTemplate(o.geral.nomeProjeto || "Sem nome", TIPOS_ORCAMENTO[o.tipo].icone, o)} />
        <Action icon={FolderPlus} label="Criar projeto" />
        <Action icon={ArrowLeft} label="Duplicar" />
      </div>

      <section className="mt-8 rounded-2xl border border-border/60 bg-surface-1/40 p-6">
        <h2 className="font-display text-lg font-semibold tracking-tight">Detalhamento ({o.calculo.itens.length} itens)</h2>
        <div className="mt-3 divide-y divide-border/40">
          {o.calculo.itens.map((it, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate">{it.label}</p>
                <p className="text-[11px] text-muted-foreground">{it.grupo} · {it.qtd}× {fmtBRL(it.unitario)}</p>
              </div>
              <p className="shrink-0 font-display text-sm tabular-nums">{fmtBRL(it.total)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Big({ label, value, primary, success }: { label: string; value: string; primary?: boolean; success?: boolean }) {
  const color = primary ? "text-primary" : success ? "text-success" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight md:text-3xl ${color}`}>{value}</p>
    </div>
  );
}

function Action({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-surface-1/60 px-4 py-3 text-sm transition hover:border-primary/30 hover:bg-surface-1">
      <Icon className="size-4 text-primary" /> {label}
    </button>
  );
}
