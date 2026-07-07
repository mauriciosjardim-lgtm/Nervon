import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { listContracts, listFiles, listEvents, deleteVault, getVault } from "@/lib/contratos/api";
import type { ClientVault } from "@/lib/contratos/types";
import { Danger, DocumentDownload, Trash, TickCircle } from "iconsax-react";

/**
 * Confirmação de exclusão de cofre — ação irreversível.
 * Oferece baixar um backup (JSON) de tudo antes de apagar do banco.
 */
export function ExcluirCofreModal({
  vault, open, onClose, onDeleted,
}: {
  vault: ClientVault | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [baixou, setBaixou] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!vault) return null;

  const baixarBackup = async () => {
    setErro(null);
    try {
      const [v, contratos, arquivos, eventos] = await Promise.all([
        getVault(vault.id), listContracts(vault.id), listFiles(vault.id), listEvents(vault.id),
      ]);
      const backup = {
        exportado_em: new Date().toISOString(),
        cofre: v, contratos, arquivos, eventos,
      };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safe = vault.name.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
      a.href = url;
      a.download = `backup-${safe}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setBaixou(true);
    } catch (e: any) {
      setErro(e?.message ?? "Não foi possível gerar o backup.");
    }
  };

  const excluir = async () => {
    setExcluindo(true); setErro(null);
    try {
      await deleteVault(vault.id);
      onDeleted();
      onClose();
    } catch (e: any) {
      setErro(e?.message ?? "Erro ao excluir.");
      setExcluindo(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-destructive">
            <Danger size={18} color="currentColor" variant="Bold" /> Excluir cofre
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            Você está prestes a excluir o cofre de <strong>{vault.name}</strong>.
          </p>
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] text-destructive">
            Esta ação <strong>não tem volta</strong>. Todos os dados deste cofre — contratos, arquivos e histórico — serão <strong>perdidos permanentemente</strong>.
          </div>
          <p className="text-[13px] text-muted-foreground">
            Recomendamos baixar um backup antes de continuar.
          </p>

          <Button variant="outline" onClick={baixarBackup} className="w-full gap-2">
            {baixou
              ? <><TickCircle size={15} color="var(--color-primary)" variant="Bold" /> Backup baixado</>
              : <><DocumentDownload size={15} color="currentColor" variant="Linear" /> Baixar backup (JSON)</>}
          </Button>

          {erro && <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{erro}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={excluindo}>Cancelar</Button>
          <Button
            onClick={excluir}
            disabled={excluindo}
            className="gap-1.5 bg-destructive text-white hover:bg-destructive/90"
          >
            <Trash size={15} color="currentColor" variant="Linear" />
            {excluindo ? "Excluindo…" : "Excluir definitivamente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
