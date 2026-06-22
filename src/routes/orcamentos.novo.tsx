import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { z } from "zod";
import {
  ArrowLeft, ArrowRight, Sparkles, Trash2, Plus,
  Plane, Gamepad2, Lightbulb, Mic, Car, Captions, Image, Monitor, Smartphone, Palette, Zap,
} from "lucide-react";
import { WizardStepper } from "@/components/orcamentos/wizard-stepper";
import { ResumoLateral } from "@/components/orcamentos/resumo-lateral";
import { CampoNumero } from "@/components/orcamentos/campo-numero";
import { CampoToggle } from "@/components/orcamentos/campo-toggle";
import {
  PAYLOAD_VAZIO, PRESETS_INICIAIS_POR_TIPO, TIPOS_ORCAMENTO, TIPO_ICONS,
  calcular, fmtBRL,
  type OrcamentoPayload, type TipoOrcamento, type ExtraCustom,
} from "@/lib/mock/orcamentos";
import { orcamentosActions, getTemplate } from "@/lib/hooks/useOrcamentos";
import { useCustos } from "@/lib/mock/custos";

const searchSchema = z.object({
  tipo: z.enum(["institucional", "mensal", "podcast", "captacao", "edicao", "fotografia", "custom"]).optional(),
  template: z.string().optional(),
});

export const Route = createFileRoute("/orcamentos/novo")({
  head: () => ({ meta: [{ title: "Novo orçamento — MakersHub" }] }),
  validateSearch: searchSchema,
  component: NovoOrcamento,
});

const STEPS = [
  { id: 0, label: "Geral" },
  { id: 1, label: "Produção" },
  { id: 2, label: "Pós" },
  { id: 3, label: "Extras" },
  { id: 4, label: "Resultado" },
];

function NovoOrcamento() {
  const { tipo, template } = Route.useSearch();
  const navigate = useNavigate();
  const custos = useCustos();

  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const [payload, setPayload] = useState<OrcamentoPayload>(() => {
    if (template) {
      const tpl = getTemplate(template);
      if (tpl) return { ...tpl.payload, margem: custos.margemPadrao };
    }
    const t: TipoOrcamento = tipo ?? "custom";
    const preset = PRESETS_INICIAIS_POR_TIPO[t];
    let base = preset ? preset() : PAYLOAD_VAZIO(t);
    if (!preset && t === "custom") {
      // "Monte do zero" começa realmente vazio — sem itens pré-carregados
      base = { ...base, producao: { ...base.producao, diarias: 0 }, pos: { ...base.pos, videos: 0, revisoes: 0 } };
    }
    return { ...base, margem: custos.margemPadrao };
  });

  const setPart = <K extends keyof OrcamentoPayload>(k: K, v: OrcamentoPayload[K]) =>
    setPayload(p => ({ ...p, [k]: v }));

  const next = () => setStep(s => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep(s => Math.max(0, s - 1));

  const podeAvancar = step === 0 ? !!payload.geral.nomeProjeto.trim() && !!payload.geral.cliente.trim() : true;
  const TipoIcon = TIPO_ICONS[payload.tipo];

  const handleNext = () => {
    if (!podeAvancar) { setShowErrors(true); return; }
    setShowErrors(false);
    if (step === 3) { setStep(4); } else { next(); }
  };

  const [salvando, setSalvando] = useState(false);
  const salvarEAvancar = async () => {
    setSalvando(true);
    try {
      const orc = await orcamentosActions.salvar(payload);
      navigate({ to: "/orcamentos/$id", params: { id: orc.id } });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-7 md:px-8 md:py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/orcamentos" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
          <TipoIcon className="size-3.5" /> {TIPOS_ORCAMENTO[payload.tipo].label}
        </p>
      </div>

      <div className="mb-8">
        <WizardStepper steps={STEPS} current={step} onJump={i => setStep(i)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0 space-y-6">
          {step === 0 && <StepGeral payload={payload} setPart={setPart} showErrors={showErrors} />}
          {step === 1 && <StepProducao payload={payload} setPart={setPart} />}
          {step === 2 && <StepPos payload={payload} setPart={setPart} />}
          {step === 3 && <StepExtras payload={payload} setPart={setPart} />}
          {step === 4 && <StepResultado payload={payload} onSalvar={salvarEAvancar} salvando={salvando} />}

          {step < 4 && (
            <footer className="flex items-center justify-between pt-2">
              <button
                onClick={prev} disabled={step === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-surface-1/40 px-4 py-2 text-sm transition hover:border-primary/30 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowLeft className="size-3.5" /> Anterior
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-[0_0_24px_-8px_var(--primary)] transition hover:bg-primary-glow"
              >
                {step === 3 ? "Ver resultado" : "Próximo"} <ArrowRight className="size-3.5" />
              </button>
            </footer>
          )}
        </main>

        {step < 4 && (
          <div className="lg:block">
            <ResumoLateral payload={payload} onMargemChange={v => setPart("margem", v)} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============== Steps ============== */
function StepGeral({ payload, setPart, showErrors }: { payload: OrcamentoPayload; setPart: any; showErrors: boolean }) {
  const { geral } = payload;
  const erroCliente = showErrors && !geral.cliente.trim();
  const erroNome = showErrors && !geral.nomeProjeto.trim();
  return (
    <Card title="Informações gerais" hint="Quem é o cliente e qual o nome do projeto.">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Cliente" error={erroCliente ? "Campo obrigatório" : undefined}>
          <input value={geral.cliente} onChange={e => setPart("geral", { ...geral, cliente: e.target.value })}
            placeholder="Nome ou empresa"
            className={`h-11 w-full rounded-lg border bg-background/40 px-3 text-sm outline-none transition focus:border-primary/50 ${erroCliente ? "border-destructive" : "border-border/60"}`} />
        </Field>
        <Field label="Nome do projeto" error={erroNome ? "Campo obrigatório" : undefined}>
          <input value={geral.nomeProjeto} onChange={e => setPart("geral", { ...geral, nomeProjeto: e.target.value })}
            placeholder="Ex.: Campanha Verão"
            className={`h-11 w-full rounded-lg border bg-background/40 px-3 text-sm outline-none transition focus:border-primary/50 ${erroNome ? "border-destructive" : "border-border/60"}`} />
        </Field>
        <Field label="Data prevista">
          <input type="date" value={geral.dataPrevista?.slice(0, 10) ?? ""} onChange={e => setPart("geral", { ...geral, dataPrevista: e.target.value })}
            className="h-11 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm outline-none transition focus:border-primary/50" />
        </Field>
        <Field label="Responsável">
          <input value={geral.responsavel} onChange={e => setPart("geral", { ...geral, responsavel: e.target.value })}
            className="h-11 w-full rounded-lg border border-border/60 bg-background/40 px-3 text-sm outline-none transition focus:border-primary/50" />
        </Field>
      </div>
    </Card>
  );
}

function StepProducao({ payload, setPart }: { payload: OrcamentoPayload; setPart: any }) {
  const { producao: p } = payload;
  const set = (patch: Partial<typeof p>) => setPart("producao", { ...p, ...patch });
  return (
    <Card title="Produção" hint="Equipe e equipamento em campo.">
      <div className="grid gap-3 md:grid-cols-2">
        <CampoNumero label="Diárias de captação" value={p.diarias} onChange={v => set({ diarias: v })} min={1} max={30} sufixo="dias" />
        <CampoNumero label="Quantidade de câmeras" hint="A primeira já vem com o videomaker" value={p.cameras} onChange={v => set({ cameras: v })} min={1} max={8} />
        <CampoNumero label="Operadores adicionais" value={p.operadorAdicional} onChange={v => set({ operadorAdicional: v })} max={10} />
        <CampoNumero label="Assistentes" value={p.assistente} onChange={v => set({ assistente: v })} max={10} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CampoToggle icone={Plane} label="Drone" hint="DJI Mavic / equivalente" value={p.drone} onChange={v => set({ drone: v })} />
        <CampoToggle icone={Gamepad2} label="Drone FPV" hint="Cinematic FPV" value={p.droneFpv} onChange={v => set({ droneFpv: v })} />
        <CampoToggle icone={Lightbulb} label="Iluminação" hint="Kit de luz profissional" value={p.iluminacao} onChange={v => set({ iluminacao: v })} />
        <CampoToggle icone={Mic} label="Captação de áudio" hint="Lapela + boom" value={p.audio} onChange={v => set({ audio: v })} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CampoToggle icone={Car} label="Deslocamento" hint="Cobrar quilometragem" value={p.deslocamento} onChange={v => set({ deslocamento: v, km: v ? p.km || 50 : 0 })} />
        {p.deslocamento && (
          <CampoNumero label="Quilômetros (ida + volta)" value={p.km} onChange={v => set({ km: v })} step={10} max={5000} sufixo="km" />
        )}
      </div>
    </Card>
  );
}

function StepPos({ payload, setPart }: { payload: OrcamentoPayload; setPart: any }) {
  const { pos: q } = payload;
  const set = (patch: Partial<typeof q>) => setPart("pos", { ...q, ...patch });
  return (
    <Card title="Pós-produção" hint="Edição, motion e entregas finais.">
      <div className="grid gap-3 md:grid-cols-2">
        <CampoNumero label="Vídeos entregues" value={q.videos} onChange={v => set({ videos: v })} max={60} />
        <CampoNumero label="Shorts / Reels" value={q.shorts} onChange={v => set({ shorts: v })} max={60} />
        <CampoNumero label="Horas de Motion" value={q.motionHoras} onChange={v => set({ motionHoras: v })} step={2} max={200} sufixo="h" />
        <CampoNumero label="Horas de Color Grading" value={q.colorHoras} onChange={v => set({ colorHoras: v })} step={1} max={100} sufixo="h" />
        <CampoNumero label="Revisões inclusas" hint="A partir de 3 viram horas extras" value={q.revisoes} onChange={v => set({ revisoes: v })} min={1} max={10} />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CampoToggle icone={Captions} label="Legendagem" value={q.legendagem} onChange={v => set({ legendagem: v })} />
        <CampoToggle icone={Image} label="Thumbnail" value={q.thumb} onChange={v => set({ thumb: v })} />
        <CampoToggle icone={Monitor} label="Versão horizontal (16:9)" value={q.horizontal} onChange={v => set({ horizontal: v })} />
        <CampoToggle icone={Smartphone} label="Versão vertical (9:16)" value={q.vertical} onChange={v => set({ vertical: v })} />
      </div>
    </Card>
  );
}

function StepExtras({ payload, setPart }: { payload: OrcamentoPayload; setPart: any }) {
  const { extras: e } = payload;
  const set = (patch: Partial<typeof e>) => setPart("extras", { ...e, ...patch });

  const addCustom = () => set({ custom: [...e.custom, { id: `c-${Date.now()}`, label: "", qtd: 1, valor: 0 }] });
  const updCustom = (id: string, patch: Partial<ExtraCustom>) =>
    set({ custom: e.custom.map(c => c.id === id ? { ...c, ...patch } : c) });
  const rmCustom = (id: string) => set({ custom: e.custom.filter(c => c.id !== id) });

  return (
    <Card title="Extras" hint="Itens opcionais e personalizados.">
      <div className="grid gap-3 md:grid-cols-2">
        <CampoNumero label="Locuções" value={e.locucao} onChange={v => set({ locucao: v })} max={20} />
        <CampoNumero label="Roteiros" value={e.roteiro} onChange={v => set({ roteiro: v })} max={20} />
        <CampoNumero label="Diárias de fotografia" value={e.fotografia} onChange={v => set({ fotografia: v })} max={30} />
        <CampoNumero label="Coberturas adicionais" value={e.coberturaAdicional} onChange={v => set({ coberturaAdicional: v })} max={30} />
        <CampoNumero label="Diárias de hospedagem" value={e.hospedagem} onChange={v => set({ hospedagem: v })} max={30} sufixo="dias" />
        <CampoNumero label="Refeições" value={e.alimentacao} onChange={v => set({ alimentacao: v })} max={200} sufixo="pessoa/dia" />
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <CampoToggle icone={Palette} label="Direção criativa" value={e.direcaoCriativa} onChange={v => set({ direcaoCriativa: v })} />
        <CampoToggle icone={Zap} label="Entrega urgente" hint="Taxa por priorização" value={e.entregaUrgente} onChange={v => set({ entregaUrgente: v })} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Itens personalizados</p>
          <button onClick={addCustom} className="inline-flex items-center gap-1 text-xs text-primary transition hover:underline">
            <Plus className="size-3.5" /> Adicionar item
          </button>
        </div>
        <div className="space-y-2">
          {e.custom.length === 0 && <p className="rounded-lg border border-dashed border-border/40 p-4 text-center text-xs text-muted-foreground">Nenhum item personalizado.</p>}
          {e.custom.map(c => (
            <div key={c.id} className="grid grid-cols-[1fr_80px_120px_36px] gap-2 rounded-lg border border-border/60 bg-surface-1/40 p-2">
              <input value={c.label} onChange={ev => updCustom(c.id, { label: ev.target.value })}
                placeholder="Descrição"
                className="h-9 rounded-md border border-border/40 bg-background/40 px-3 text-sm outline-none focus:border-primary/40" />
              <input type="number" min={0} value={c.qtd} onChange={ev => updCustom(c.id, { qtd: Number(ev.target.value) || 0 })}
                className="h-9 rounded-md border border-border/40 bg-background/40 px-2 text-sm tabular-nums outline-none focus:border-primary/40" />
              <input type="number" min={0} value={c.valor} onChange={ev => updCustom(c.id, { valor: Number(ev.target.value) || 0 })}
                placeholder="R$ unit"
                className="h-9 rounded-md border border-border/40 bg-background/40 px-2 text-sm tabular-nums outline-none focus:border-primary/40" />
              <button onClick={() => rmCustom(c.id)} className="grid place-items-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function StepResultado({ payload, onSalvar, salvando }: { payload: OrcamentoPayload; onSalvar: () => void; salvando?: boolean }) {
  const custos = useCustos();
  const calc = useMemo(() => calcular(payload, custos), [payload, custos]);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/15 via-surface-1/60 to-surface-1/30 p-8 shadow-[var(--shadow-elevated)]">
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: "var(--gradient-glow)" }} />
        <div className="relative">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" /> Orçamento finalizado
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">{payload.geral.nomeProjeto || "Sem nome"}</h2>
          <p className="text-sm text-muted-foreground">{payload.geral.cliente || "—"}</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BigNumber label="Custo operacional" value={fmtBRL(calc.custoOperacional)} tone="muted" />
            <BigNumber label="Margem" value={`${calc.margem}%`} tone="muted" />
            <BigNumber label="Preço sugerido" value={fmtBRL(calc.precoSugerido)} tone="primary" />
            <BigNumber label="Lucro estimado" value={fmtBRL(calc.lucroEstimado)} tone="success" />
          </div>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
        <button onClick={onSalvar} disabled={salvando} className="rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-[0_0_24px_-8px_var(--primary)] transition hover:bg-primary-glow disabled:opacity-60">
          {salvando ? "Salvando..." : "Salvar orçamento"}
        </button>
        <button onClick={onSalvar} className="rounded-xl border border-border/60 bg-surface-1/60 px-4 py-3 text-sm transition hover:border-primary/30">
          Gerar proposta
        </button>
        <button onClick={onSalvar} className="rounded-xl border border-border/60 bg-surface-1/60 px-4 py-3 text-sm transition hover:border-primary/30">
          Criar projeto
        </button>
        <button onClick={onSalvar} className="rounded-xl border border-border/60 bg-surface-1/60 px-4 py-3 text-sm transition hover:border-primary/30">
          Salvar como template
        </button>
      </div>

      <Card title="Detalhamento" hint={`${calc.itens.length} itens`}>
        <div className="divide-y divide-border/40">
          {calc.itens.map((it, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 text-sm">
              <div className="min-w-0">
                <p className="truncate">{it.label}</p>
                <p className="text-[11px] text-muted-foreground">{it.grupo} · {it.qtd}× {fmtBRL(it.unitario)}</p>
              </div>
              <p className="shrink-0 font-display text-sm tabular-nums">{fmtBRL(it.total)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ============== Helpers UI ============== */
function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-surface-1/40 p-6 shadow-[var(--shadow-card)]">
      <header className="mb-5">
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </header>
      {children}
    </section>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
    </label>
  );
}

function BigNumber({ label, value, tone }: { label: string; value: string; tone: "muted" | "primary" | "success" }) {
  const color = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <div className="rounded-xl border border-border/40 bg-background/30 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-semibold tabular-nums tracking-tight md:text-3xl ${color}`}>{value}</p>
    </div>
  );
}
