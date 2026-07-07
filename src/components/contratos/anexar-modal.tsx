import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addFile } from "@/lib/contratos/api";
import { FILE_CATEGORY_LABEL, type FileCategory } from "@/lib/contratos/types";

export function AnexarModal({
  open, onClose, vaultId, contractId, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  vaultId: string;
  contractId?: string | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<FileCategory>("documento_cliente");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setName(""); setUrl(""); setCategory("documento_cliente"); setErro(null); }
  }, [open]);

  const salvar = async () => {
    if (!name.trim()) { setErro("Informe o nome do arquivo."); return; }
    if (!url.trim()) { setErro("Cole o link do arquivo."); return; }
    setSalvando(true); setErro(null);
    try {
      await addFile({ client_vault_id: vaultId, contract_id: contractId ?? null, name: name.trim(), file_url: url.trim(), category });
      onSaved();
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao anexar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="font-display">Anexar arquivo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome do arquivo</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Contrato assinado.pdf" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link do arquivo (URL)</Label>
            <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" />
            <p className="text-[10px] text-muted-foreground">Cole um link (Drive, Dropbox, etc.). Upload direto chega em breve.</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={v => setCategory(v as FileCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(FILE_CATEGORY_LABEL) as FileCategory[]).map(k => (
                  <SelectItem key={k} value={k}>{FILE_CATEGORY_LABEL[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {erro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Anexando…" : "Anexar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
