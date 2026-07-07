import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { maskCNPJ, maskCEP } from "@/lib/format";

/**
 * Configuração dos dados da empresa que emite os contratos (a CONTRATADA).
 * Vive dentro do módulo Contratos para ficar à mão de quem monta contratos.
 */
export function DadosEmpresaModal({
  open, onClose, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { empresa, refreshEmpresa } = useAuth();
  const e = empresa as any;
  const [f, setF] = useState({ razao_social: "", cnpj: "", endereco: "", cidade: "", estado: "", cep: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setF({
      razao_social: e?.razao_social ?? "", cnpj: e?.cnpj ?? "", endereco: e?.endereco ?? "",
      cidade: e?.cidade ?? "", estado: e?.estado ?? "", cep: e?.cep ?? "",
    });
  }, [open, empresa]);

  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const salvar = async () => {
    if (!empresa) return;
    setSaving(true);
    await supabase.from("empresas").update({
      razao_social: f.razao_social.trim() || null,
      cnpj: f.cnpj.trim() || null,
      endereco: f.endereco.trim() || null,
      cidade: f.cidade.trim() || null,
      estado: f.estado.trim() || null,
      cep: f.cep.trim() || null,
    }).eq("id", empresa.id);
    await refreshEmpresa();
    setSaving(false);
    onSaved?.();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Dados da minha empresa</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Aparecem como <strong>CONTRATADA</strong> em todos os contratos que você gerar.
        </p>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Razão social / Nome</Label>
            <Input value={f.razao_social} onChange={ev => set("razao_social", ev.target.value)} placeholder="Ex: Aurora Filmes Produções LTDA" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">CNPJ</Label>
              <Input inputMode="numeric" value={f.cnpj} onChange={ev => set("cnpj", maskCNPJ(ev.target.value))} placeholder="00.000.000/0000-00" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CEP</Label>
              <Input inputMode="numeric" value={f.cep} onChange={ev => set("cep", maskCEP(ev.target.value))} placeholder="00000-000" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Endereço</Label>
            <Input value={f.endereco} onChange={ev => set("endereco", ev.target.value)} placeholder="Rua, número, bairro" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input value={f.cidade} onChange={ev => set("cidade", ev.target.value)} placeholder="Também usada como foro padrão" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Input value={f.estado} onChange={ev => set("estado", ev.target.value)} placeholder="UF" maxLength={2} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={saving}>{saving ? "Salvando…" : "Salvar dados"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
