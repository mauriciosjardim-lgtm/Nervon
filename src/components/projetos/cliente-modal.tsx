import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { comercial } from "@/lib/hooks/useComercial";
import { CORES_PROJETO } from "@/lib/mock/projetos";

export function ClienteModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (client: { id: string; nome: string }) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(CORES_PROJETO[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setColor(CORES_PROJETO[0]);
    }
  }, [open]);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const client = await comercial.criarCliente({ nome: name.trim(), accentColor: color });
      if (!client) throw new Error();
      toast.success("Cliente criado. Agora você pode adicionar os projetos dele.");
      onCreated(client);
    } catch {
      toast.error("Não foi possível criar o cliente");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Building2 className="size-5 text-primary" /> Novo cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-primary/20 bg-primary/[0.05] p-3 text-[11px] leading-5 text-muted-foreground">
            O cliente será o workspace principal. Dentro dele você criará projetos, fluxos,
            entregas e o acesso ao Makers Members.
          </div>
          <label className="space-y-1.5">
            <Label>Nome do cliente</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Aurora Café"
              autoFocus
              onKeyDown={(event) => event.key === "Enter" && void save()}
            />
          </label>
          <div className="space-y-2">
            <Label>Cor de identificação</Label>
            <div className="flex flex-wrap gap-2 rounded-xl border border-border/60 bg-surface-1/30 p-3">
              {CORES_PROJETO.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Selecionar ${item}`}
                  onClick={() => setColor(item)}
                  style={{ backgroundColor: item }}
                  className={`size-7 rounded-full transition ${
                    color === item
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={!name.trim() || saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Criar cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

