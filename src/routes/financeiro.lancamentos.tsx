import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Pencil } from "lucide-react";
import { Add, SearchNormal, TrendUp, TrendDown, Trash, TickCircle, Refresh, Filter, Paperclip } from "iconsax-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { NovoLancamentoModal } from "@/components/financeiro/novo-lancamento-modal";
import { StatusBadge } from "@/components/financeiro/status-badge";
import {
  fmtBRL, fmtData,
  type Lancamento, type LancTipo, type LancStatus,
} from "@/lib/mock/financeiro";
import { useFinanceiroSupa, financeiroActions } from "@/lib/hooks/useFinanceiro";
import { toast } from "sonner";

export const Route = createFileRoute("/financeiro/lancamentos")({
  component: LancamentosPage,
});

function LancamentosPage() {
  const { lancamentos } = useFinanceiroSupa();
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState<"todos" | LancTipo>("todos");
  const [status, setStatus] = useState<"todos" | LancStatus>("todos");
  const [novoOpen, setNovoOpen] = useState(false);
  const [editar, setEditar] = useState<Lancamento | undefined>();

  const filtrados = useMemo(() => {
    const ql = q.toLowerCase().trim();
    return lancamentos
      .filter(l => tipo === "todos" || l.tipo === tipo)
      .filter(l => status === "todos" || l.status === status)
      .filter(l => !ql ||
        l.descricao.toLowerCase().includes(ql) ||
        l.categoria.toLowerCase().includes(ql) ||
        (l.cliente?.toLowerCase().includes(ql) ?? false) ||
        (l.projeto?.toLowerCase().includes(ql) ?? false))
      .sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  }, [lancamentos, q, tipo, status]);

  const totalReceita = filtrados.filter(l => l.tipo === "receita").reduce((s, l) => s + l.valor, 0);
  const totalDespesa = filtrados.filter(l => l.tipo === "despesa").reduce((s, l) => s + l.valor, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => { setEditar(undefined); setNovoOpen(true); }} className="gap-2">
          <Add size={16} color="currentColor" variant="Linear" className="text-primary-foreground" />
          Novo lançamento
        </Button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchNormal size={14} color="currentColor" variant="Linear" className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-primary" />
            <Input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar descrição, cliente, projeto…"
              className="h-9 w-64 pl-8"
            />
          </div>
          <Select value={tipo} onValueChange={(v: typeof tipo) => setTipo(v)}>
            <SelectTrigger className="h-9 w-36"><Filter size={14} color="currentColor" variant="Linear" className="text-primary" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v: typeof status) => setStatus(v)}>
            <SelectTrigger className="h-9 w-40"><Filter size={14} color="currentColor" variant="Linear" className="text-primary" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              <SelectItem value="previsto">Previsto</SelectItem>
              <SelectItem value="recebido">Recebido</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Resumo do filtro */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>{filtrados.length} lançamentos</span>
        <span>·</span>
        {/* A Visão geral filtra por mês; aqui é tudo. Sem esse rótulo os totais
            pareciam contradizer os KPIs da outra aba. */}
        <span className="text-muted-foreground/70">todo o período</span>
        <span>·</span>
        <span className="flex items-center gap-1"><TrendUp size={12} color="currentColor" variant="Linear" className="text-primary" /> Receita: <strong className="tabular-nums text-foreground">{fmtBRL(totalReceita)}</strong></span>
        <span>·</span>
        <span className="flex items-center gap-1"><TrendDown size={12} color="currentColor" variant="Linear" className="text-primary" /> Despesa: <strong className="tabular-nums text-foreground">{fmtBRL(totalDespesa)}</strong></span>
        <span>·</span>
        <span>Saldo: <strong className={`tabular-nums ${totalReceita - totalDespesa >= 0 ? "text-success" : "text-destructive"}`}>{fmtBRL(totalReceita - totalDespesa)}</strong></span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-1/40">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface-2/50 hover:bg-surface-2/50">
              <TableHead className="w-10"></TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Cliente / Projeto</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-32 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtrados.map(l => (
              <TableRow
                key={l.id}
                className="group cursor-pointer"
                onClick={() => { setEditar(l); setNovoOpen(true); }}
              >
                <TableCell>
                  <span className={`grid size-7 place-items-center rounded-lg ring-1 ${l.tipo === "receita" ? "bg-success/10 ring-success/30" : "bg-destructive/10 ring-destructive/30"}`}>
                    {l.tipo === "receita"
                      ? <TrendUp size={12} color="currentColor" variant="Linear" className="text-success" />
                      : <TrendDown size={12} color="currentColor" variant="Linear" className="text-destructive" />}
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-1.5">
                    {l.descricao}
                    {l.comprovanteUrl && (
                      <a
                        href={l.comprovanteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver comprovante"
                        onClick={e => e.stopPropagation()}
                      >
                        <Paperclip size={12} color="currentColor" variant="Linear" className="text-primary/60 hover:text-primary" />
                      </a>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{l.categoria}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div className="leading-tight">
                    {l.cliente && <div>{l.cliente}</div>}
                    {l.projeto && <div className="text-[11px] opacity-70">{l.projeto}</div>}
                    {!l.cliente && !l.projeto && <span>—</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtData(l.vencimento)}</TableCell>
                <TableCell className="whitespace-nowrap text-right font-display text-sm font-semibold tabular-nums text-foreground">
                  {l.tipo === "despesa" && "− "}{fmtBRL(l.valor)}
                </TableCell>
                <TableCell><StatusBadge status={l.status} /></TableCell>
                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                  {/* Em touch não existe hover: os botões ficavam invisíveis mas
                      continuavam clicáveis, dando pra excluir um lançamento às cegas. */}
                  <div className="flex justify-end gap-1 transition [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100">
                    {l.pagamentoEm ? (
                      <Button
                        size="icon" variant="ghost" className="size-7"
                        title="Desfazer pagamento"
                        onClick={() => { financeiroActions.desfazerPago(l.id); toast.success("Pagamento desfeito."); }}
                      >
                        <Refresh size={14} color="currentColor" variant="Linear" className="text-primary" />
                      </Button>
                    ) : (
                      <Button
                        size="icon" variant="ghost" className="size-7"
                        title={l.tipo === "receita" ? "Marcar como recebido" : "Marcar como pago"}
                        onClick={() => { financeiroActions.marcarPago(l.id); toast.success(l.tipo === "receita" ? "Recebido!" : "Pago!"); }}
                      >
                        <TickCircle size={14} color="currentColor" variant="Linear" className="text-primary" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="size-7" title="Editar"
                      onClick={() => { setEditar(l); setNovoOpen(true); }}>
                      <Pencil className="size-3.5 text-primary" />
                    </Button>
                    <Button size="icon" variant="ghost" className="size-7" title="Excluir"
                      onClick={() => { if (confirm(`Excluir o lançamento "${l.descricao}"?`)) { financeiroActions.remove(l.id); toast.success("Lançamento removido."); } }}>
                      <Trash size={14} color="currentColor" variant="Linear" className="text-primary" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <NovoLancamentoModal open={novoOpen} onOpenChange={setNovoOpen} editar={editar} />
    </div>
  );
}
