import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { maskCPF, maskCNPJ, maskCEP, maskPhone } from "@/lib/format";
import { createVault, updateVault } from "@/lib/contratos/api";
import type { ClientVault, VaultType } from "@/lib/contratos/types";

const vazio = {
  name: "", fantasy_name: "", type: "individual" as VaultType, document: "",
  email: "", phone: "", address: "", city: "", state: "", zip_code: "",
  responsible_name: "", notes: "",
};

export function CofreModal({
  open, onClose, vault, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  vault?: ClientVault | null;
  onSaved: (v?: ClientVault) => void;
}) {
  const editando = !!vault;
  const [f, setF] = useState({ ...vazio });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErro(null);
    if (vault) {
      setF({
        name: vault.name, fantasy_name: vault.fantasy_name ?? "", type: vault.type,
        document: vault.document ?? "", email: vault.email ?? "", phone: vault.phone ?? "",
        address: vault.address ?? "", city: vault.city ?? "", state: vault.state ?? "",
        zip_code: vault.zip_code ?? "", responsible_name: vault.responsible_name ?? "",
        notes: vault.notes ?? "",
      });
    } else {
      setF({ ...vazio });
    }
  }, [open, vault]);

  const set = (k: keyof typeof f, v: string) => setF(p => ({ ...p, [k]: v }));

  const salvar = async () => {
    if (!f.name.trim()) { setErro("Informe o nome do cliente."); return; }
    setSalvando(true); setErro(null);
    try {
      if (editando && vault) {
        await updateVault(vault.id, f);
        onSaved();
      } else {
        const novo = await createVault(f);
        onSaved(novo);
      }
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const pj = f.type === "company";

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{editando ? "Editar cofre" : "Novo cofre do cliente"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-surface-1 p-1">
            {(["individual", "company"] as VaultType[]).map(t => (
              <button key={t} type="button" onClick={() => set("type", t)}
                className={cn("rounded-md py-1.5 text-xs font-medium transition",
                  f.type === t ? "bg-surface-3 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {t === "individual" ? "Pessoa Física" : "Pessoa Jurídica"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{pj ? "Razão social" : "Nome completo"} <span className="text-destructive">*</span></Label>
              <Input value={f.name} onChange={e => set("name", e.target.value)} placeholder={pj ? "Ex: Aurora Filmes LTDA" : "Ex: João da Silva"} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{pj ? "Nome fantasia" : "Apelido"}</Label>
              <Input value={f.fantasy_name} onChange={e => set("fantasy_name", e.target.value)} placeholder={pj ? "Ex: Aurora" : "opcional"} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{pj ? "CNPJ" : "CPF"}</Label>
              <Input inputMode="numeric" value={f.document} onChange={e => set("document", pj ? maskCNPJ(e.target.value) : maskCPF(e.target.value))} placeholder={pj ? "00.000.000/0000-00" : "000.000.000-00"} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Responsável</Label>
              <Input value={f.responsible_name} onChange={e => set("responsible_name", e.target.value)} placeholder="Quem assina / contato" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">E-mail</Label>
              <Input type="email" value={f.email} onChange={e => set("email", e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Telefone / WhatsApp</Label>
              <Input inputMode="tel" value={f.phone} onChange={e => set("phone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Endereço</Label>
            <Input value={f.address} onChange={e => set("address", e.target.value)} placeholder="Rua, número, bairro" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Cidade</Label>
              <Input value={f.city} onChange={e => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Estado</Label>
              <Input value={f.state} onChange={e => set("state", e.target.value)} placeholder="UF" maxLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">CEP</Label>
              <Input inputMode="numeric" value={f.zip_code} onChange={e => set("zip_code", maskCEP(e.target.value))} placeholder="00000-000" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Observações internas</Label>
            <Textarea rows={2} value={f.notes} onChange={e => set("notes", e.target.value)} placeholder="Notas que só a sua equipe vê" />
          </div>

          {erro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando}>{salvando ? "Salvando…" : editando ? "Salvar" : "Criar cofre"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
