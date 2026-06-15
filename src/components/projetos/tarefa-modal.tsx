import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRIORIDADES, getFaseInfo, type Tarefa, type Prioridade, type StatusTarefa } from "@/lib/mock/projetos";
import { projetosActions } from "@/lib/hooks/useProjetos";
import { Trash2 } from "lucide-react";

const toLocalInput = (iso: string) => {
  const d = new Date(iso); const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function TarefaModal({ open, onClose, projetoId, tarefa, fases }: { open: boolean; onClose: () => void; projetoId: string; tarefa?: Tarefa | null; fases?: string[] }) {
  const editando = !!tarefa;
  const [titulo, setTitulo] = useState(""); const [descricao, setDescricao] = useState("");
  const [responsavel, setResponsavel] = useState(""); const [prazo, setPrazo] = useState("");
  const [prioridade, setPrioridade] = useState<Prioridade>("media"); const [status, setStatus] = useState<StatusTarefa>("briefing");

  useEffect(() => {
    if (!open) return;
    if (tarefa) {
      setTitulo(tarefa.titulo); setDescricao(tarefa.descricao ?? ""); setResponsavel(tarefa.responsavel);
      setPrazo(tarefa.prazo ? toLocalInput(tarefa.prazo) : ""); setPrioridade(tarefa.prioridade); setStatus(tarefa.status);
    } else {
      const amanha = new Date(); amanha.setDate(amanha.getDate() + 1); amanha.setHours(10, 0, 0, 0);
      setTitulo(""); setDescricao(""); setResponsavel("Você"); setPrazo(toLocalInput(amanha.toISOString())); setPrioridade("media"); setStatus("briefing");
    }
  }, [open, tarefa]);

  const salvar = () => {
    if (!titulo.trim()) return;
    const payload = {
      projetoId, titulo: titulo.trim(), descricao: descricao.trim() || undefined,
      responsavel: responsavel.trim() || "Você",
      prazo: prazo ? new Date(prazo).toISOString() : undefined,
      prioridade, status, concluida: tarefa?.concluida ?? false,
    };
    if (editando && tarefa) projetosActions.atualizarTarefa(tarefa.id, payload);
    else projetosActions.criarTarefa(payload);
    onClose();
  };

  const remover = () => { if (tarefa && confirm("Remover tarefa?")) { projetosActions.removerTarefa(tarefa.id); onClose(); } };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">{editando ? "Editar tarefa" : "Nova tarefa"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Responsável</Label><Input value={responsavel} onChange={e => setResponsavel(e.target.value)} /></div>
            <div className="space-y-1.5"><Label className="text-xs">Prazo (opcional)</Label><Input type="datetime-local" value={prazo} onChange={e => setPrazo(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Prioridade</Label>
              <Select value={prioridade} onValueChange={v => setPrioridade(v as Prioridade)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PRIORIDADES).map(([id, p]) => <SelectItem key={id} value={id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Fase</Label>
              <Select value={status} onValueChange={v => setStatus(v as StatusTarefa)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(fases ?? []).map(f => <SelectItem key={f} value={f}>{getFaseInfo(f).label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Descrição</Label><Textarea rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} /></div>
          {prazo && <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] text-primary">📅 Esta tarefa aparecerá na Agenda automaticamente</p>}
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {editando ? <Button variant="ghost" size="sm" onClick={remover} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /> Remover</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
