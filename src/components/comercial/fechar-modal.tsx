import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DocumentText1, Kanban, UserTick, MagicStar, DollarCircle, Calendar } from "iconsax-react";
import type { Icon as IconsaxIcon } from "iconsax-react";
import { toast } from "sonner";
import { comercial, getEmpresa, fmtBRL, type Lead } from "@/lib/hooks/useComercial";

export function FecharModal({ lead, open, onOpenChange }: { lead: Lead; open: boolean; onOpenChange: (v: boolean) => void }) {
  const empresa = getEmpresa(lead.empresaId);
  const [proposta, setProposta] = useState(true);
  const [contrato, setContrato] = useState(true);
  const [projeto, setProjeto] = useState(true);
  const [cliente, setCliente] = useState(true);
  const [cobranca, setCobranca] = useState(true);
  const [onboarding, setOnboarding] = useState(false);

  const confirmar = () => {
    comercial.moverEtapa(lead.id, "fechado");
    comercial.addEvento(lead.id, {
      tipo: "fechado",
      titulo: "Lead marcado como fechado",
      descricao: `${empresa?.nome} · ${fmtBRL(lead.valor)}`,
    });
    const criados: string[] = [];
    if (proposta) criados.push("proposta");
    if (contrato) criados.push("contrato");
    if (projeto) criados.push("projeto");
    if (cliente) criados.push("cliente");
    if (cobranca) criados.push("cobrança");
    if (onboarding) criados.push("onboarding");
    toast.success(
      criados.length
        ? `Parabéns! Geramos automaticamente: ${criados.join(", ")}.`
        : "Lead fechado.",
      { duration: 5000 },
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="mx-auto mb-2 grid size-14 place-items-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
            <MagicStar size={28} color="currentColor" variant="Linear" className="text-primary" />
          </div>
          <DialogTitle className="text-center font-display text-xl">Parabéns!</DialogTitle>
          <DialogDescription className="text-center">
            Você fechou <strong className="text-foreground">{empresa?.nome}</strong> — {fmtBRL(lead.valor)}.
            <br />O que deseja fazer agora?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1">
          <Linha icon={DocumentText1} title="Gerar proposta"     desc="Documento da proposta vinculada ao lead"   checked={proposta}   onChange={setProposta} />
          <Linha icon={DocumentText1} title="Gerar contrato"     desc="Contrato pronto para envio de assinatura"  checked={contrato}   onChange={setContrato} />
          <Linha icon={Kanban}        title="Criar projeto"      desc="Abrir projeto no módulo de operação"       checked={projeto}    onChange={setProjeto} />
          <Linha icon={DollarCircle}  title="Criar cobrança"     desc="Lançamento financeiro com o valor fechado" checked={cobranca}   onChange={setCobranca} />
          <Linha icon={UserTick}      title="Promover a cliente" desc="Transformar de lead em cliente ativo"      checked={cliente}    onChange={setCliente} />
          <Linha icon={Calendar}      title="Agendar onboarding" desc="Reunião inicial com o novo cliente"        checked={onboarding} onChange={setOnboarding} />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirmar}>
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Linha({
  icon: Icon, title, desc, checked, onChange,
}: { icon: typeof IconsaxIcon; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface-1/40 p-3 transition hover:border-primary/40 hover:bg-surface-2/40">
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <Icon size={16} color="currentColor" variant="Linear" className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
    </label>
  );
}
