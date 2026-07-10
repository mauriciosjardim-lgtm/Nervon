import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { COR_PRESETS } from "@/lib/brandColor";
import { comercial } from "@/lib/hooks/useComercial";
import type { Empresa } from "@/lib/mock/comercial";
import { cn } from "@/lib/utils";

export function ClienteModal({
  open, onClose, cliente, onCriado,
}: {
  open: boolean;
  onClose: () => void;
  cliente?: Empresa | null;
  onCriado?: (cliente: Empresa) => void;
}) {
  const editando = !!cliente;
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(COR_PRESETS[0].value);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(cliente?.nome ?? "");
    setCor(cliente?.accentColor ?? COR_PRESETS[0].value);
  }, [open, cliente]);

  const salvar = async () => {
    if (!nome.trim()) return;
    setSalvando(true);
    if (editando && cliente) {
      await comercial.updateEmpresa(cliente.id, { nome: nome.trim(), accentColor: cor });
    } else {
      const novo = await comercial.criarCliente({ nome: nome.trim(), accentColor: cor });
      if (novo) onCriado?.(novo);
    }
    setSalvando(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="font-display">{editando ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do cliente</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Aurora Filmes" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Cor de destaque</Label>
            <div className="grid grid-cols-5 gap-2">
              {COR_PRESETS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCor(c.value)}
                  title={c.label}
                  className={cn(
                    "grid size-9 place-items-center rounded-lg border-2 transition",
                    cor === c.value ? "border-white/70 scale-105" : "border-transparent hover:border-white/25",
                  )}
                >
                  <span className={cn("size-6 rounded-md shadow", c.classe)} />
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando || !nome.trim()}>{editando ? "Salvar" : "Criar cliente"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
