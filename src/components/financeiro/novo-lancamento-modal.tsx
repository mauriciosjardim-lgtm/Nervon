import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORIAS_RECEITA, CATEGORIAS_DESPESA,
  type LancTipo, type Lancamento,
} from "@/lib/mock/financeiro";
import { financeiroActions, useFinanceiroSupa } from "@/lib/hooks/useFinanceiro";
import { useProjetos } from "@/lib/hooks/useProjetos";
import { useCarteiras, getCarteiraAtiva } from "@/lib/hooks/useCarteiras";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipoInicial?: LancTipo;
  editar?: Lancamento;
}

export function NovoLancamentoModal({ open, onOpenChange, tipoInicial = "receita", editar }: Props) {
  const [tipo, setTipo] = useState<LancTipo>(tipoInicial);
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState(() => new Date().toISOString().slice(0, 10));
  const [cliente, setCliente] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [carteiraId, setCarteiraId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("PIX");
  const [observacoes, setObservacoes] = useState("");
  const [pago, setPago] = useState(false);

  const { lancamentos } = useFinanceiroSupa();
  const { projetos } = useProjetos();
  const { carteiras } = useCarteiras();
  const categorias = tipo === "receita" ? CATEGORIAS_RECEITA : CATEGORIAS_DESPESA;
  const clientes = useMemo(() => Array.from(new Set(lancamentos.map(l => l.cliente).filter(Boolean))) as string[], [lancamentos]);

  useEffect(() => {
    if (open) {
      if (editar) {
        setTipo(editar.tipo);
        setCategoria(editar.categoria);
        setDescricao(editar.descricao);
        setValor(editar.valor);
        setVencimento(editar.vencimento.slice(0, 10));
        setCliente(editar.cliente || "");
        setProjetoId(editar.projetoId || "");
        setCarteiraId(editar.carteiraId || "");
        setFormaPagamento(editar.formaPagamento || "PIX");
        setObservacoes(editar.observacoes || "");
        setPago(!!editar.pagamentoEm);
      } else {
        setTipo(tipoInicial);
        setCategoria(tipoInicial === "receita" ? "Projeto" : "Equipe");
        setDescricao(""); setValor(0);
        setVencimento(new Date().toISOString().slice(0, 10));
        setCliente(""); setProjetoId(""); setCarteiraId(getCarteiraAtiva() ?? ""); setFormaPagamento("PIX");
        setObservacoes(""); setPago(false);
      }
    }
  }, [open, editar, tipoInicial]);

  const salvar = () => {
    if (!descricao.trim()) { toast.error("Descrição é obrigatória."); return; }
    if (valor <= 0) { toast.error("Informe um valor válido."); return; }

    const payload = {
      tipo, categoria: categoria || "Outros", descricao: descricao.trim(),
      valor,
      vencimento: new Date(vencimento + "T12:00:00").toISOString(),
      pagamentoEm: pago ? new Date(vencimento + "T12:00:00").toISOString() : null,
      cliente: cliente.trim() || undefined,
      projetoId: projetoId || undefined,
      projeto: projetos.find(p => p.id === projetoId)?.nome || undefined,
      carteiraId: carteiraId || undefined,
      formaPagamento, observacoes: observacoes.trim() || undefined,
    };

    if (editar) {
      financeiroActions.update(editar.id, payload);
      toast.success("Lançamento atualizado.");
    } else {
      financeiroActions.add(payload);
      toast.success(`${tipo === "receita" ? "Receita" : "Despesa"} registrada.`);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            {editar ? "Editar lançamento" : "Novo lançamento"}
          </DialogTitle>
          <DialogDescription>
            Registre receitas e despesas para acompanhar caixa e margem em tempo real.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Toggle tipo */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-1 p-1">
            <button
              type="button"
              onClick={() => { setTipo("receita"); setCategoria("Projeto"); }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition",
                tipo === "receita" ? "bg-surface-3 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrendingUp className={cn("size-3.5", tipo === "receita" ? "text-success" : "text-primary")} />
              Receita
            </button>
            <button
              type="button"
              onClick={() => { setTipo("despesa"); setCategoria("Equipe"); }}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition",
                tipo === "despesa" ? "bg-surface-3 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrendingDown className={cn("size-3.5", tipo === "despesa" ? "text-destructive" : "text-primary")} />
              Despesa
            </button>
          </div>

          <div className="grid gap-1.5">
            <Label>Descrição</Label>
            <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex.: Parcela 2/4 — campanha Vibe" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Valor (R$)</Label>
              <CurrencyInput value={valor} onValueChange={setValor} />
            </div>
            <div className="grid gap-1.5">
              <Label>Vencimento</Label>
              <Input type="date" value={vencimento} onChange={e => setVencimento(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Carteira</Label>
              <Select value={carteiraId || "__none__"} onValueChange={v => setCarteiraId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhuma</SelectItem>
                  {carteiras.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label>Forma de pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["PIX", "Transferência", "Boleto", "Cartão", "Dinheiro"].map(f => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Cliente (opcional)</Label>
              <Input list="clientes-fin" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Nome do cliente" />
              <datalist id="clientes-fin">
                {clientes.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="grid gap-1.5">
              <Label>Projeto (opcional)</Label>
              <Select value={projetoId || "__none__"} onValueChange={v => setProjetoId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {projetos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Anotações internas" rows={3} />
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-1 p-3 text-sm">
            <input
              type="checkbox"
              checked={pago}
              onChange={e => setPago(e.target.checked)}
              className="size-4 accent-primary"
            />
            <span>Já foi {tipo === "receita" ? "recebido" : "pago"}</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={salvar}>{editar ? "Salvar alterações" : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
