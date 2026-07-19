export type LancTipo = "receita" | "despesa";
export type LancStatus = "previsto" | "recebido" | "pago" | "atrasado";

export interface Lancamento {
  id: string;
  tipo: LancTipo;
  categoria: string;
  descricao: string;
  valor: number;
  vencimento: string; // ISO
  pagamentoEm?: string | null;
  status: LancStatus;
  cliente?: string;
  projeto?: string;
  projetoId?: string;
  carteiraId?: string;
  formaPagamento?: string;
  observacoes?: string;
  comprovanteUrl?: string;
}

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLDetalhado = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (iso: string) =>
  new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

// Rótulo de eixo de gráfico. Arredondar para "k" inteiro colapsa ticks distintos
// no mesmo texto (1500 e 750 viravam "1k"), então abaixo de 1k mostra o valor
// cheio e acima usa uma casa decimal quando não é múltiplo exato de mil.
export const fmtEixo = (v: number) => {
  const abs = Math.abs(v);
  if (abs < 1000) return String(Math.round(v));
  const k = v / 1000;
  return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1).replace(".", ",")}k`;
};

export const STATUS_META: Record<LancStatus, { label: string; color: string; bg: string; border: string }> = {
  previsto: { label: "Previsto", color: "text-info", bg: "bg-info/10", border: "border-info/30" },
  recebido: { label: "Recebido", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  pago: { label: "Pago", color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  atrasado: { label: "Atrasado", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
};

export const CATEGORIAS_RECEITA = ["Projeto", "Avulso", "Treinamento", "Outros"];
export const CATEGORIAS_DESPESA = ["Equipe", "Equipamento", "Software", "Marketing", "Impostos", "Estrutura", "Outros"];

export interface MetricasFin {
  recebido: number;
  aReceber: number;
  atrasadoReceber: number;
  /** aReceber + atrasadoReceber — tudo que ainda está em aberto na entrada. */
  aReceberTotal: number;
  pago: number;
  aPagar: number;
  atrasadoPagar: number;
  /** aPagar + atrasadoPagar — tudo que ainda está em aberto na saída. */
  aPagarTotal: number;
  saldoRealizado: number;
  saldoPrevisto: number;
  margemRealizada: number;
}

export function calcularMetricas(lancs: Lancamento[]): MetricasFin {
  const r = lancs.filter(l => l.tipo === "receita");
  const d = lancs.filter(l => l.tipo === "despesa");
  const recebido = r.filter(l => l.status === "recebido").reduce((s, l) => s + l.valor, 0);
  const aReceber = r.filter(l => l.status === "previsto").reduce((s, l) => s + l.valor, 0);
  const atrasadoReceber = r.filter(l => l.status === "atrasado").reduce((s, l) => s + l.valor, 0);
  const pago = d.filter(l => l.status === "pago").reduce((s, l) => s + l.valor, 0);
  const aPagar = d.filter(l => l.status === "previsto").reduce((s, l) => s + l.valor, 0);
  const atrasadoPagar = d.filter(l => l.status === "atrasado").reduce((s, l) => s + l.valor, 0);
  // Atrasado continua em aberto: ignorá-lo aqui sumia com dinheiro real dos dois
  // lados da previsão e fazia "a receber" divergir da lista que o próprio KPI abre.
  const aReceberTotal = aReceber + atrasadoReceber;
  const aPagarTotal = aPagar + atrasadoPagar;
  const saldoRealizado = recebido - pago;
  const saldoPrevisto = (recebido + aReceberTotal) - (pago + aPagarTotal);
  const margemRealizada = recebido ? (saldoRealizado / recebido) * 100 : 0;
  return { recebido, aReceber, atrasadoReceber, aReceberTotal, pago, aPagar, atrasadoPagar, aPagarTotal, saldoRealizado, saldoPrevisto, margemRealizada };
}

// Fonte ÚNICA do resultado mensal realizado (competência = vencimento).
// Usada por Dashboard e Performance para que os números "do mês" batam sempre.
// Nunca usa pagamentoEm nem new Date() sobre strings date-only.
export function resumoFinanceiroMes(lancamentos: Lancamento[], referencia = new Date()) {
  const chave = `${referencia.getFullYear()}-${String(referencia.getMonth() + 1).padStart(2, "0")}`;
  const doMes = lancamentos.filter(l => l.vencimento.slice(0, 7) === chave);
  const receita = doMes
    .filter(l => l.tipo === "receita" && l.status === "recebido")
    .reduce((s, l) => s + l.valor, 0);
  const despesas = doMes
    .filter(l => l.tipo === "despesa" && l.status === "pago")
    .reduce((s, l) => s + l.valor, 0);
  const lucro = receita - despesas;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;
  return { receita, despesas, lucro, margem };
}

// Série mensal (últimos 6 meses) para gráfico
export function serieMensal(lancs: Lancamento[]) {
  const meses: { key: string; label: string; receita: number; despesa: number; saldo: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(); dt.setDate(1); dt.setMonth(dt.getMonth() - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      key,
      label: dt.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      receita: 0, despesa: 0, saldo: 0,
    });
  }
  for (const l of lancs) {
    // Competência = vencimento (mesmo critério do resumo mensal). Slice para "YYYY-MM"
    // evita o bug de parse UTC de datas date-only vindas do Supabase.
    const key = l.vencimento.slice(0, 7);
    const m = meses.find(x => x.key === key);
    if (!m) continue;
    if (l.tipo === "receita" && l.status === "recebido") m.receita += l.valor;
    else if (l.tipo === "despesa" && l.status === "pago") m.despesa += l.valor;
  }
  meses.forEach(m => { m.saldo = m.receita - m.despesa; });
  return meses;
}

export interface LinhaProjeto {
  chave: string;
  nome: string;
  cliente?: string;
  /** Agrupado por cliente por falta de projeto no lançamento. */
  porCliente: boolean;
  receita: number;
  despesa: number;
  saldo: number;
  margem: number;
}

// Na prática quase nenhum lançamento traz `projeto` preenchido, então agrupar só
// por ele jogava a planilha inteira num balde "— Sem projeto —". Caindo para o
// cliente, cada frente de trabalho aparece separada; o balde final só recebe o
// que não tem nem projeto nem cliente — e aí não herda nome de ninguém.
export function porProjeto(lancs: Lancamento[]): LinhaProjeto[] {
  const map = new Map<string, LinhaProjeto>();
  for (const l of lancs) {
    const projeto = l.projeto?.trim();
    const cliente = l.cliente?.trim();
    const porCliente = !projeto && !!cliente;
    const chave = projeto ? `p:${projeto}` : cliente ? `c:${cliente}` : "sem";
    if (!map.has(chave)) {
      map.set(chave, {
        chave,
        nome: projeto || cliente || "— Sem projeto nem cliente —",
        cliente: projeto ? cliente : undefined,
        porCliente,
        receita: 0,
        despesa: 0,
        saldo: 0,
        margem: 0,
      });
    }
    const a = map.get(chave)!;
    if (l.tipo === "receita") a.receita += l.valor;
    else a.despesa += l.valor;
    if (projeto && cliente && !a.cliente) a.cliente = cliente;
  }
  return Array.from(map.values()).map(a => ({
    ...a,
    saldo: a.receita - a.despesa,
    margem: a.receita ? ((a.receita - a.despesa) / a.receita) * 100 : 0,
  })).sort((a, b) => b.saldo - a.saldo);
}

export function porCategoria(lancs: Lancamento[], tipo: LancTipo) {
  const map = new Map<string, number>();
  lancs.filter(l => l.tipo === tipo).forEach(l => {
    map.set(l.categoria, (map.get(l.categoria) || 0) + l.valor);
  });
  return Array.from(map.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor);
}
