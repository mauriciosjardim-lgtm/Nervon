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
}

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtBRLDetalhado = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtData = (iso: string) =>
  new Date(iso.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

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
  pago: number;
  aPagar: number;
  atrasadoPagar: number;
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
  const saldoRealizado = recebido - pago;
  const saldoPrevisto = (recebido + aReceber) - (pago + aPagar);
  const margemRealizada = recebido ? (saldoRealizado / recebido) * 100 : 0;
  return { recebido, aReceber, atrasadoReceber, pago, aPagar, atrasadoPagar, saldoRealizado, saldoPrevisto, margemRealizada };
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
    // Slice to "YYYY-MM" avoids UTC-midnight parsing bug for date-only strings from Supabase
    const key = (l.pagamentoEm ?? l.vencimento).slice(0, 7);
    const m = meses.find(x => x.key === key);
    if (!m) continue;
    if (l.tipo === "receita") m.receita += l.valor;
    else m.despesa += l.valor;
  }
  meses.forEach(m => { m.saldo = m.receita - m.despesa; });
  return meses;
}

export function porProjeto(lancs: Lancamento[]) {
  const map = new Map<string, { nome: string; cliente?: string; receita: number; despesa: number; saldo: number; margem: number }>();
  for (const l of lancs) {
    const k = l.projeto || "— Sem projeto —";
    if (!map.has(k)) map.set(k, { nome: k, cliente: l.cliente, receita: 0, despesa: 0, saldo: 0, margem: 0 });
    const a = map.get(k)!;
    if (l.tipo === "receita") a.receita += l.valor;
    else a.despesa += l.valor;
    if (l.cliente && !a.cliente) a.cliente = l.cliente;
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
