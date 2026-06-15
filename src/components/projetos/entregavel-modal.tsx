import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TIPOS_ENTREGAVEL, STATUS_ENTREGAVEL, type Entregavel, type TipoEntregavel, type StatusEntregavel } from "@/lib/mock/projetos";
import { projetosActions } from "@/lib/hooks/useProjetos";
import { Trash2 } from "lucide-react";

export function EntregavelModal({
  open, onClose, projetoId, entregavel,
}: { open: boolean; onClose: () => void; projetoId: string; entregavel?: Entregavel | null }) {
  const editando = !!entregavel;
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoEntregavel>("video");
  const [status, setStatus] = useState<StatusEntregavel>("pendente");
  const [link, setLink] = useState("");
  const [notas, setNotas] = useState("");

  useEffect(() => {
    if (!open) return;
    if (entregavel) {
      setTitulo(entregavel.titulo); setTipo(entregavel.tipo); setStatus(entregavel.status);
      setLink(entregavel.link ?? ""); setNotas(entregavel.notas ?? "");
    } else {
      setTitulo(""); setTipo("video"); setStatus("pendente"); setLink(""); setNotas("");
    }
  }, [open, entregavel]);

  const salvar = () => {
    if (!titulo.trim()) return;
    const payload = { projetoId, titulo: titulo.trim(), tipo, status, link: link.trim() || undefined, notas: notas.trim() || undefined };
    if (editando && entregavel) projetosActions.atualizarEntregavel(entregavel.id, payload);
    else projetosActions.criarEntregavel(payload);
    onClose();
  };

  const remover = () => {
    if (entregavel && confirm(`Remover entregável "${entregavel.titulo}"?`)) {
      projetosActions.removerEntregavel(entregavel.id);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display">{editando ? "Editar entregável" : "Novo entregável"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Reel #03 — Skincare" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-xs">Tipo</Label>
              <Select value={tipo} onValueChange={v => setTipo(v as TipoEntregavel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(TIPOS_ENTREGAVEL).map(([id, t]) => <SelectItem key={id} value={id}>{t.icone} {t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Status</Label>
              <Select value={status} onValueChange={v => setStatus(v as StatusEntregavel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(STATUS_ENTREGAVEL).map(([id, s]) => <SelectItem key={id} value={id}>{s.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs">Link (Drive, Vimeo, Dropbox…)</Label><Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://drive.google.com/…" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Notas</Label><Textarea rows={3} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observações, feedback do cliente, versão…" /></div>
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {editando ? <Button variant="ghost" size="sm" onClick={remover} className="text-destructive hover:text-destructive"><Trash2 className="size-4" /> Remover</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
