import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { type Marco } from "@/lib/mock/projetos";
import { projetosActions } from "@/lib/hooks/useProjetos";
import { Trash } from "iconsax-react";

const toLocalInput = (iso: string) => {
  const d = new Date(iso); const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function MarcoModal({ open, onClose, projetoId, marco }: { open: boolean; onClose: () => void; projetoId: string; marco?: Marco | null }) {
  const editando = !!marco;
  const [titulo, setTitulo] = useState(""); const [data, setData] = useState("");

  useEffect(() => {
    if (!open) return;
    if (marco) { setTitulo(marco.titulo); setData(toLocalInput(marco.data)); }
    else {
      const futuro = new Date(); futuro.setDate(futuro.getDate() + 14); futuro.setHours(10, 0, 0, 0);
      setTitulo(""); setData(toLocalInput(futuro.toISOString()));
    }
  }, [open, marco]);

  const salvar = () => {
    if (!titulo.trim() || !data) return;
    const payload = { projetoId, titulo: titulo.trim(), data: new Date(data).toISOString(), status: marco?.status ?? "pendente" as const };
    if (editando && marco) projetosActions.atualizarMarco(marco.id, payload);
    else projetosActions.criarMarco(payload);
    onClose();
  };

  const remover = () => { if (marco && confirm("Remover marco?")) { projetosActions.removerMarco(marco.id); onClose(); } };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display">{editando ? "Editar marco" : "Novo marco"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-xs">Título</Label><Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Entrega final" /></div>
          <div className="space-y-1.5"><Label className="text-xs">Data</Label><Input type="datetime-local" value={data} onChange={e => setData(e.target.value)} /></div>
          <p className="rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-[11px] text-primary">🚩 Marcos aparecem automaticamente na Agenda</p>
        </div>
        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {editando ? <Button variant="ghost" size="sm" onClick={remover} className="text-destructive hover:text-destructive"><Trash size={16} color="currentColor" variant="Linear" /> Remover</Button> : <span />}
          <div className="flex gap-2"><Button variant="outline" onClick={onClose}>Cancelar</Button><Button onClick={salvar}>{editando ? "Salvar" : "Criar"}</Button></div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
