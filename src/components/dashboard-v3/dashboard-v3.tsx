import { lazy, Suspense, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft2,
  ArrowRight2,
  Calendar,
  EmptyWallet,
  Kanban,
  SearchNormal,
} from "iconsax-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/lib/auth";
import { useAgendaSupa } from "@/lib/hooks/useAgenda";
import { useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import { useProjetos } from "@/lib/hooks/useProjetos";
import { resumoFinanceiroMes, type Lancamento } from "@/lib/mock/financeiro";
import { loadMetas, progressoMes } from "@/lib/mock/metas";
import { calcularResumoProgresso } from "@/lib/projetos/progresso";
import { cn } from "@/lib/utils";

const RevenueChartV3 = lazy(() =>
  import("./revenue-chart").then((modulo) => ({ default: modulo.RevenueChartV3 })),
);

const brl = (valor: number) =>
  valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const dataCurta = (valor: string) => {
  const data = new Date(valor.slice(0, 10) + "T12:00:00");
  return Number.isNaN(data.getTime())
    ? "Sem data"
    : format(data, "dd MMM", { locale: ptBR }).replace(".", "");
};

function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        "rounded-[1.4rem] border border-white/[0.065] bg-surface-1/75 shadow-[inset_0_1px_rgba(255,255,255,.025),0_24px_55px_-38px_rgba(0,0,0,.9)] backdrop-blur-2xl",
        className,
      )}
    >
      {children}
    </section>
  );
}

function PanelHeader({ title, href, action }: { title: string; href?: string; action?: string }) {
  return (
    <header className="flex min-h-8 items-center gap-3">
      <h2 className="font-display text-[15px] font-semibold tracking-[-0.025em] text-foreground">
        {title}
      </h2>
      {href && (
        <Link
          to={href as never}
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-medium tracking-[0.005em] text-muted-foreground transition hover:text-primary"
        >
          {action ?? "Ver tudo"}
          <ArrowRight2 size={11} color="currentColor" variant="Linear" />
        </Link>
      )}
    </header>
  );
}

function RevenuePanel({ lancamentos }: { lancamentos: Lancamento[] }) {
  return (
    <GlassPanel className="h-full overflow-hidden p-4 sm:p-5">
      <PanelHeader title="Fluxo de receita" href="/financeiro" action="Ver financeiro" />
      <div className="mt-2">
        <Suspense
          fallback={
            <div className="h-[220px] animate-pulse rounded-2xl bg-white/[0.025] sm:h-[250px]" />
          }
        >
          <RevenueChartV3 lancamentos={lancamentos} />
        </Suspense>
      </div>
      <div className="mt-1 flex items-center gap-5 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <i className="h-0.5 w-3 rounded-full bg-primary" /> Receita
        </span>
        <span className="flex items-center gap-1.5">
          <i className="h-0.5 w-3 rounded-full bg-muted-foreground/50" /> Custos
        </span>
      </div>
    </GlassPanel>
  );
}

function ProjectDistribution({
  projetos,
  tarefas,
}: {
  projetos: ReturnType<typeof useProjetos>["projetos"];
  tarefas: ReturnType<typeof useProjetos>["tarefas"];
}) {
  const ativos = projetos.filter((projeto) => !["entrega", "concluido"].includes(projeto.fase));
  const producao = ativos.filter((projeto) =>
    ["briefing", "pre", "captacao", "edicao"].includes(projeto.fase),
  ).length;
  const revisao = ativos.filter((projeto) => projeto.fase === "revisao").length;
  const atencao = ativos.filter(
    (projeto) => calcularResumoProgresso(projeto, tarefas).saude !== "saudavel",
  ).length;
  const total = Math.max(ativos.length, 1);
  const p1 = Math.round((producao / total) * 100);
  const p2 = Math.round((revisao / total) * 100);

  return (
    <GlassPanel className="min-h-[245px] p-4 sm:p-5">
      <PanelHeader title="Projetos ativos" href="/projetos" />
      <div className="grid min-h-[178px] grid-cols-[minmax(130px,1fr)_115px] items-center gap-3">
        <div
          className="relative mx-auto aspect-square w-full max-w-[165px] rounded-full"
          style={{
            background: `conic-gradient(var(--primary) 0 ${p1}%, color-mix(in oklch, var(--primary) 52%, var(--surface-3)) ${p1}% ${p1 + p2}%, var(--surface-3) ${p1 + p2}% 100%)`,
          }}
        >
          <div className="absolute inset-[27px] grid place-content-center rounded-full border border-white/[0.04] bg-surface-1 text-center shadow-[inset_0_0_18px_rgba(0,0,0,.18)]">
            <strong className="font-display text-[28px] font-semibold tracking-[-0.05em]">
              {String(ativos.length).padStart(2, "0")}
            </strong>
            <span className="text-[9px] text-muted-foreground">projetos</span>
          </div>
        </div>
        <div className="space-y-3 text-[9px] text-muted-foreground">
          <DistributionLegend color="bg-primary" label="Produção" value={producao} />
          <DistributionLegend color="bg-primary/55" label="Revisão" value={revisao} />
          <DistributionLegend color="bg-warning" label="Em atenção" value={atencao} />
        </div>
      </div>
    </GlassPanel>
  );
}

function DistributionLegend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="grid grid-cols-[8px_1fr] gap-2">
      <i className={cn("mt-1 size-2 rounded-full", color)} />
      <div>
        <span>{label}</span>
        <strong className="mt-0.5 block text-[11px] font-semibold text-foreground">
          {value} {value === 1 ? "projeto" : "projetos"}
        </strong>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  badge,
  badgeMuted,
}: {
  label: string;
  value: string;
  detail: string;
  badge: string;
  badgeMuted?: boolean;
}) {
  return (
    <GlassPanel className="flex min-h-[116px] flex-col justify-between p-4">
      <div>
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-[24px] font-semibold tabular-nums tracking-[-0.045em]">
          {value}
        </p>
      </div>
      <div className="flex items-end gap-2 text-[10px] text-muted-foreground">
        <span>{detail}</span>
        <span
          className={cn(
            "ml-auto rounded-full px-2 py-1 font-semibold",
            badgeMuted
              ? "bg-white/[0.06] text-foreground/75"
              : "bg-primary text-primary-foreground",
          )}
        >
          {badge}
        </span>
      </div>
    </GlassPanel>
  );
}

function MonthlyGoalCard({
  realizado,
  meta,
  percentual,
  atingida,
}: {
  realizado: number;
  meta: number;
  percentual: number;
  atingida: boolean;
}) {
  const progressoVisual = Math.min(100, Math.max(0, percentual));

  return (
    <GlassPanel className="min-h-[116px] p-4 sm:p-5">
      <div className="flex items-start gap-4">
        <div>
          <p className="text-[12px] font-medium text-muted-foreground">Meta mensal</p>
          <p className="mt-1 font-display text-[24px] font-semibold tabular-nums tracking-[-0.045em]">
            {percentual.toFixed(0)}%
          </p>
        </div>
        <span
          className={cn(
            "ml-auto rounded-full px-2.5 py-1 text-[10px] font-semibold",
            atingida
              ? "bg-primary text-primary-foreground"
              : "bg-white/[0.06] text-foreground/75",
          )}
        >
          {atingida ? "Atingida" : "Em curso"}
        </span>
      </div>

      <div
        role="progressbar"
        aria-label="Progresso da meta mensal"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progressoVisual)}
        className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.055]"
      >
        <div
          className="relative h-full overflow-hidden rounded-full bg-primary shadow-[0_0_14px_-2px_var(--primary)] transition-[width] duration-700 ease-out after:absolute after:inset-y-0 after:right-0 after:w-8 after:bg-gradient-to-r after:from-transparent after:to-white/35 after:animate-pulse"
          style={{ width: `${progressoVisual}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span className="tabular-nums">{brl(realizado)} realizados</span>
        <span className="tabular-nums">Meta {brl(meta)}</span>
      </div>
    </GlassPanel>
  );
}

function FinancialGlassCard({
  receitaMes,
  despesasMes,
  receitaAno,
}: {
  receitaMes: number;
  despesasMes: number;
  receitaAno: number;
}) {
  const [cartaoAtivo, setCartaoAtivo] = useState(0);
  const cartoes = [
    {
      id: "receita-mes",
      titulo: "Receita total · este mês",
      valor: receitaMes,
      detalhe: "ENTRADAS RECEBIDAS",
      fundo:
        "bg-[radial-gradient(circle_at_86%_8%,color-mix(in_oklch,var(--primary)_20%,transparent),transparent_28%),linear-gradient(145deg,rgba(70,76,64,.48),rgba(30,31,34,.44)_58%,rgba(17,18,20,.58))]",
    },
    {
      id: "despesas-mes",
      titulo: "Despesas atuais · este mês",
      valor: despesasMes,
      detalhe: "SAÍDAS PAGAS",
      fundo:
        "bg-[radial-gradient(circle_at_18%_4%,color-mix(in_oklch,var(--primary)_13%,transparent),transparent_32%),linear-gradient(145deg,rgba(54,58,52,.52),rgba(27,29,30,.5)_58%,rgba(16,17,19,.62))]",
    },
    {
      id: "receita-ano",
      titulo: "Receita total · no ano",
      valor: receitaAno,
      detalhe: "ACUMULADO DO ANO",
      fundo:
        "bg-[radial-gradient(circle_at_78%_12%,color-mix(in_oklch,var(--primary)_25%,transparent),transparent_30%),linear-gradient(145deg,rgba(62,72,53,.5),rgba(28,31,29,.48)_58%,rgba(16,18,18,.62))]",
    },
  ];

  return (
    <div className="relative h-[215px] [perspective:1000px] [transform-style:preserve-3d]">
      {cartoes.map((cartao, indice) => {
        const posicao = (indice - cartaoAtivo + cartoes.length) % cartoes.length;
        const naFrente = posicao === 0;
        const deslocamento = posicao === 0 ? 32 : posicao === 1 ? 16 : 0;
        const recuo = posicao === 0 ? 0 : posicao === 1 ? 18 : 36;
        const escala = posicao === 0 ? 1 : posicao === 1 ? 0.965 : 0.93;
        const deslocamentoX = posicao === 0 ? 0 : posicao === 1 ? -7 : 10;
        const profundidade = posicao === 0 ? 52 : posicao === 1 ? 0 : -52;
        const rotacaoY = posicao === 0 ? 0 : posicao === 1 ? -1.2 : 2.4;
        const rotacaoX = posicao === 0 ? 0 : posicao === 1 ? -0.8 : -1.8;

        return (
          <div
            key={cartao.id}
            data-testid={`financial-card-${cartao.id}`}
            data-position={posicao}
            className={cn(
              "absolute top-0 h-[183px] origin-top overflow-hidden rounded-[1.45rem] border border-primary/[0.17] text-left outline-none backdrop-blur-3xl [backface-visibility:hidden] [transform-style:preserve-3d] will-change-transform transition-all duration-700 ease-[cubic-bezier(.2,.8,.2,1)]",
              cartao.fundo,
              naFrente &&
                "opacity-100 saturate-100 shadow-[inset_0_1px_rgba(255,255,255,.11),0_26px_58px_rgba(0,0,0,.28)]",
              posicao === 1 &&
                "opacity-76 saturate-75 shadow-[inset_0_1px_rgba(255,255,255,.07),0_16px_36px_rgba(0,0,0,.18)]",
              posicao === 2 &&
                "opacity-48 saturate-50 shadow-[inset_0_1px_rgba(255,255,255,.04),0_8px_22px_rgba(0,0,0,.12)]",
            )}
            style={{
              left: recuo,
              right: recuo,
              zIndex: 30 - posicao * 10,
              transform: `translate3d(${deslocamentoX}px, ${deslocamento}px, ${profundidade}px) rotateX(${rotacaoX}deg) rotateY(${rotacaoY}deg) scale(${escala})`,
            }}
          >
            {!naFrente && (
              <button
                type="button"
                aria-label={`Trazer ${cartao.titulo.toLowerCase()} para frente`}
                onClick={() => setCartaoAtivo(indice)}
                className="absolute inset-0 z-20 rounded-[1.45rem] outline-none ring-inset transition hover:ring-1 hover:ring-primary/35 focus-visible:ring-2 focus-visible:ring-primary"
              />
            )}

            <div
              className={cn(
                "pointer-events-none absolute inset-0 p-5 transition-opacity duration-300",
                naFrente ? "opacity-100 delay-200" : "opacity-10",
              )}
            >
              <div className="pointer-events-none absolute -right-20 -top-16 size-56 rounded-full border border-white/[0.12]" />
              <div className="pointer-events-none absolute -bottom-40 -right-16 size-72 rounded-full border border-white/[0.08]" />
              {naFrente && (
                <button
                  type="button"
                  data-testid="financial-card-next"
                  aria-label="Mostrar próximo indicador financeiro"
                  onClick={() => setCartaoAtivo((indice + 1) % cartoes.length)}
                  className="pointer-events-auto absolute right-4 top-4 grid size-9 place-items-center rounded-full bg-foreground/90 text-background shadow-lg transition duration-300 hover:scale-105 hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <ArrowRight2 size={17} color="currentColor" variant="Linear" />
                </button>
              )}
              <p className="text-[11px] font-medium tracking-[0.005em] text-foreground/60">
                {cartao.titulo}
              </p>
              <p className="mt-2 font-display text-[31px] font-semibold tabular-nums tracking-[-0.055em]">
                {brl(cartao.valor)}
              </p>
              <p className="absolute bottom-5 left-5 text-[10px] leading-relaxed tracking-[0.015em] text-foreground/45">
                MAKERSHUB · {cartao.detalhe}
                <br />
                Atualizado agora
              </p>
              <div className="absolute bottom-5 right-5 flex gap-1.5" aria-hidden="true">
                {cartoes.map((item, marcador) => (
                  <i
                    key={item.id}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300",
                      marcador === cartaoAtivo ? "w-4 bg-primary" : "w-1 bg-white/25",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FinancialPanel({
  receitaMes,
  despesasMes,
  receitaAno,
}: {
  receitaMes: number;
  despesasMes: number;
  receitaAno: number;
}) {
  return (
    <GlassPanel className="overflow-hidden p-4">
      <PanelHeader title="Meu financeiro" href="/financeiro" />
      <div className="mt-1">
        <FinancialGlassCard
          receitaMes={receitaMes}
          despesasMes={despesasMes}
          receitaAno={receitaAno}
        />
      </div>
    </GlassPanel>
  );
}

function UpcomingProjects({ projetos }: { projetos: ReturnType<typeof useProjetos>["projetos"] }) {
  const proximos = projetos
    .filter((projeto) => !["concluido"].includes(projeto.fase) && projeto.dataEntrega)
    .sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega))
    .slice(0, 3);

  return (
    <div>
      <PanelHeader title="Próximas entregas" href="/agenda" action="Ver agenda" />
      <div className="mt-2 divide-y divide-white/[0.055]">
        {proximos.length === 0 ? (
          <p className="py-7 text-center text-xs text-muted-foreground">Nenhuma entrega próxima.</p>
        ) : (
          proximos.map((projeto) => (
            <Link
              key={projeto.id}
              to="/projetos/$id"
              params={{ id: projeto.id }}
              className="grid min-h-[58px] grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 py-2 transition hover:opacity-80"
            >
              <span className="grid size-9 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                {projeto.nome
                  .split(" ")
                  .map((parte) => parte[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[12px] font-medium text-foreground">
                  {projeto.nome}
                </strong>
                <small className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                  {projeto.cliente}
                </small>
              </span>
              <span className="text-[10px] font-semibold text-foreground/75">
                {dataCurta(projeto.dataEntrega)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function CalendarPanelV3() {
  const { eventos } = useAgendaSupa();
  const hoje = new Date();
  const [mesRef, setMesRef] = useState(hoje);
  const inicio = startOfMonth(mesRef);
  const fim = endOfMonth(mesRef);
  const dias = eachDayOfInterval({ start: inicio, end: fim });
  const offset = (inicio.getDay() + 6) % 7;
  const diasComEvento = new Set(
    eventos
      .filter((evento) => isSameMonth(new Date(evento.inicio), mesRef))
      .map((evento) => format(new Date(evento.inicio), "yyyy-MM-dd")),
  );
  const proximos = eventos
    .filter((evento) => new Date(evento.inicio) >= hoje)
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .slice(0, 3);

  return (
    <GlassPanel className="h-full min-w-0 overflow-hidden bg-surface-1/65 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-full border border-primary/15 bg-primary/[0.07] text-primary">
          <Calendar size={17} color="currentColor" variant="Bold" />
        </span>
        <div>
          <h2 className="font-display text-[15px] font-semibold tracking-[-0.025em]">Calendário</h2>
          <p className="mt-0.5 text-[10px] capitalize text-muted-foreground">
            {format(mesRef, "MMMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => setMesRef((mes) => addMonths(mes, -1))}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
          >
            <ArrowLeft2 size={14} color="currentColor" variant="Linear" />
          </button>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => setMesRef((mes) => addMonths(mes, 1))}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition hover:bg-white/[0.05] hover:text-foreground"
          >
            <ArrowRight2 size={14} color="currentColor" variant="Linear" />
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-7 text-center">
        {["S", "T", "Q", "Q", "S", "S", "D"].map((dia, indice) => (
          <span
            key={`${dia}-${indice}`}
            className="text-[9px] font-medium text-muted-foreground/55"
          >
            {dia}
          </span>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-7 gap-y-1">
        {Array.from({ length: offset }, (_, indice) => (
          <span key={`offset-${indice}`} />
        ))}
        {dias.map((dia) => {
          const chave = format(dia, "yyyy-MM-dd");
          const hojeMesmo = isToday(dia);
          const temEvento = diasComEvento.has(chave);
          return (
            <span
              key={chave}
              className={cn(
                "relative mx-auto grid size-8 place-items-center rounded-full text-[10px] transition",
                hojeMesmo
                  ? "bg-primary font-semibold text-primary-foreground shadow-[0_0_22px_-5px_var(--primary)]"
                  : "text-foreground/65 hover:bg-white/[0.045] hover:text-foreground",
              )}
            >
              {dia.getDate()}
              {temEvento && !hojeMesmo && (
                <i className="absolute bottom-0.5 size-1 rounded-full bg-primary" />
              )}
            </span>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/[0.055] pt-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-semibold text-foreground">Próximos compromissos</p>
          <Link
            to="/agenda"
            className="text-[10px] font-medium text-muted-foreground transition hover:text-primary"
          >
            Ver agenda
          </Link>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {proximos.length === 0 ? (
            <p className="py-5 text-center text-[10px] text-muted-foreground">
              Agenda livre nos próximos dias.
            </p>
          ) : (
            proximos.map((evento) => (
              <div
                key={evento.id}
                className="grid min-h-[52px] grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5"
              >
                <span className="grid size-8 place-items-center rounded-full bg-primary/[0.09] text-[9px] font-semibold text-primary">
                  {format(new Date(evento.inicio), "dd")}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-foreground">
                    {evento.titulo}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                    {format(new Date(evento.inicio), "EEEE", { locale: ptBR })}
                  </p>
                </div>
                <span className="text-[9px] font-medium text-foreground/55">
                  {format(new Date(evento.inicio), "HH:mm")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </GlassPanel>
  );
}

export function DashboardV3() {
  const { usuario } = useAuth();
  const { lancamentos, loading: loadingFinanceiro } = useFinanceiroSupa({
    somenteEmpresa: true,
  });
  const { projetos, tarefas, loading: loadingProjetos } = useProjetos();
  const [aba, setAba] = useState("Visão geral");

  const financeiro = useMemo(() => resumoFinanceiroMes(lancamentos), [lancamentos]);
  const receitaAno = useMemo(() => {
    const anoAtual = String(new Date().getFullYear());
    return lancamentos
      .filter(
        (lancamento) =>
          lancamento.tipo === "receita" &&
          lancamento.status === "recebido" &&
          lancamento.vencimento.slice(0, 4) === anoAtual,
      )
      .reduce((total, lancamento) => total + lancamento.valor, 0);
  }, [lancamentos]);
  const progresso = useMemo(() => progressoMes(loadMetas(), lancamentos), [lancamentos]);
  const nome = usuario?.nome?.split(" ")[0] ?? "você";
  const mes = format(new Date(), "MMMM yyyy", { locale: ptBR });

  return (
    <div
      className="relative mx-auto w-full max-w-[1460px] overflow-hidden px-4 py-5 sm:px-6 sm:py-7 xl:px-8"
      style={{
        fontFamily: '"IBM Plex Sans", Inter, system-ui, sans-serif',
        fontFeatureSettings: '"ss02", "ss03"',
      }}
    >
      <div className="pointer-events-none absolute right-0 top-0 -z-10 size-[420px] rounded-full bg-primary/[0.055] blur-[110px]" />

      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-[28px] font-semibold tracking-[-0.045em] sm:text-[32px]">
              Meu cockpit
            </h1>
            <span className="rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-primary">
              Preview local
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Olá, {nome}. Visão consolidada de {mes}.
          </p>
        </div>
        <label className="order-first flex h-10 w-full items-center gap-2 rounded-xl border border-border/70 bg-surface-1/55 px-3 text-muted-foreground backdrop-blur-xl sm:order-none sm:ml-auto sm:w-[310px]">
          <SearchNormal size={14} color="currentColor" variant="Linear" />
          <input
            className="min-w-0 flex-1 border-0 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Buscar projetos, clientes e tarefas"
          />
        </label>
      </div>

      <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {["Visão geral", "Receitas", "Projetos", "Produção"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setAba(item)}
            className={cn(
              "h-9 shrink-0 rounded-full px-5 text-[12px] font-medium tracking-[0.005em] transition",
              aba === item
                ? "bg-primary font-semibold text-primary-foreground"
                : "bg-surface-1/70 text-muted-foreground hover:bg-surface-2 hover:text-foreground",
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[280px_minmax(420px,1fr)_280px]">
        <div className="space-y-4">
          <FinancialPanel
            receitaMes={financeiro.receita}
            despesasMes={financeiro.despesas}
            receitaAno={receitaAno}
          />
          <SummaryCard
            label="Lucro do mês"
            value={brl(financeiro.lucro)}
            detail={`${financeiro.margem.toFixed(0)}% de margem`}
            badge={financeiro.lucro >= 0 ? "Positivo" : "Atenção"}
          />
        </div>
        <div className="min-w-0 space-y-4">
          <RevenuePanel lancamentos={lancamentos} />
          <MonthlyGoalCard
            realizado={progresso.realizado}
            meta={progresso.atingiuMeta ? progresso.superMeta : progresso.meta}
            percentual={progresso.atingiuMeta ? progresso.pctSuper : progresso.pctMeta}
            atingida={progresso.atingiuMeta}
          />
        </div>
        <CalendarPanelV3 />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[.9fr_1.1fr]">
        <ProjectDistribution projetos={projetos} tarefas={tarefas} />
        <GlassPanel className="min-w-0 overflow-hidden p-4 sm:p-5">
          <UpcomingProjects projetos={projetos} />
        </GlassPanel>
      </div>

      {(loadingFinanceiro || loadingProjetos) && (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-primary/20 bg-surface-2/90 px-4 py-2 text-[10px] font-medium text-primary shadow-xl backdrop-blur-xl">
          Sincronizando dados reais…
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-3 sm:hidden">
        <Link
          to="/financeiro"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-1/70 py-3 text-[10px] text-muted-foreground"
        >
          <EmptyWallet size={16} color="currentColor" variant="Bold" />
          Financeiro
        </Link>
        <Link
          to="/projetos"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-1/70 py-3 text-[10px] text-muted-foreground"
        >
          <Kanban size={16} color="currentColor" variant="Bold" />
          Projetos
        </Link>
        <Link
          to="/agenda"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-surface-1/70 py-3 text-[10px] text-muted-foreground"
        >
          <Calendar size={16} color="currentColor" variant="Bold" />
          Agenda
        </Link>
      </div>
    </div>
  );
}
