import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Projeto, type FaseProjeto } from "@/lib/mock/projetos";
// Select de fase removido: a fase é definida pelos cards do kanban na tela do projeto
import { projetosActions } from "@/lib/hooks/useProjetos";
import { useComercial } from "@/lib/hooks/useComercial";
import { MembrosSelect } from "@/components/projetos/membros-select";
import { ClienteModal } from "@/components/projetos/cliente-modal";
import { Trash, Add } from "iconsax-react";

const toDate = (iso: string) => iso.slice(0, 10);
const fromDate = (s: string) => { const d = new Date(s); d.setHours(10, 0, 0, 0); return d.toISOString(); };

export function ProjetoModal({ open, onClose, projeto }: { open: boolean; onClose: () => void; projeto?: Projeto | null }) {
  const editando = !!projeto;
  const clientes = useComercial(s => s.empresas);
  const [nome, setNome] = useState(""); const [clienteId, setClienteId] = useState(""); const [descricao, setDescricao] = useState("");
  const [fase, setFase] = useState<FaseProjeto>("briefing"); const [equipe, setEquipe] = useState<string[]>([]); const [valor, setValor] = useState(0);
  const [dataInicio, setDataInicio] = useState(""); const [dataEntrega, setDataEntrega] = useState("");
  const [modalCliente, setModalCliente] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (projeto) {
      setNome(projeto.nome); setClienteId(projeto.clienteId ?? ""); setDescricao(projeto.descricao ?? "");
      setFase(projeto.fase); setEquipe(projeto.equipe); setValor(projeto.valor);
      setDataInicio(toDate(projeto.dataInicio)); setDataEntrega(toDate(projeto.dataEntrega));
    } else {
      const hoje = new Date(); const entrega = new Date(); entrega.setDate(entrega.getDate() + 30);
      setNome(""); setClienteId(""); setDescricao(""); setFase("briefing"); setEquipe([]); setValor(0);
      setDataInicio(toDate(hoje.toISOString())); setDataEntrega(toDate(entrega.toISOString()));
    }
  }, [open, projeto]);

  const salvar = () => {
    const cliente = clientes.find(c => c.id === clienteId);
    if (!nome.trim() || !cliente) return;
    const payload = {
      nome: nome.trim(), cliente: cliente.nome, clienteId: cliente.id, descricao: descricao.trim() || undefined, fase,
      equipe,
      valor, dataInicio: fromDate(dataInicio), dataEntrega: fromDate(dataEntrega),
      cor: "primary",
      fases: projeto?.fases ?? undefined,
    };
    if (editando && projeto) projetosActions.atualizarProjeto(projeto.id, payload);
    else projetosActions.criarProjeto(payload);
    onClose();
  };

  const remover = () => {
    if (projeto && confirm(`Remover projeto "${projeto.nome}" e todas suas tarefas/marcos?`)) {
      projetosActions.removerProjeto(projeto.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="font-display">{editando ? "Editar projeto" : "Novo projeto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Nome do projeto</Label><Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Campanha verão" /></div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Cliente</Label>
              <button type="button" onClick={() => setModalCliente(true)} className="flex items-center gap-1 text-[11px] font-medium text-primary hover:underline">
                <Add size={12} color="currentColor" /> Novo cliente
              </button>
            </div>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                {!clientes.length && <p className="p-2 text-center text-[10px] text-muted-foreground">Nenhum cliente ainda — crie um primeiro</p>}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Início</Label><Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Entrega prevista</Label><Input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Equipe do projeto</Label><MembrosSelect value={equipe} onChange={setEquipe} /></div>
          {editando && (
            <div className="space-y-1.5"><Label className="text-xs">Valor (R$)</Label><CurrencyInput value={valor} onValueChange={setValor} /></div>
          )}
          <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea rows={3} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Briefing, escopo, observações…" /></div>
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {editando ? <Button variant="ghost" size="sm" onClick={remover} className="text-destructive hover:text-destructive"><Trash size={16} color="currentColor" variant="Linear" /> Remover</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar}>{editando ? "Salvar" : "Criar projeto"}</Button></div>
        </DialogFooter>
      </DialogContent>
      <ClienteModal
        open={modalCliente}
        onClose={() => setModalCliente(false)}
        onCriado={novo => setClienteId(novo.id)}
      />
    </Dialog>
  );
}
