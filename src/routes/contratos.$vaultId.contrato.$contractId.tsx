import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AnexarModal } from "@/components/contratos/anexar-modal";
import { ContratoPaper } from "@/components/contratos/contrato-paper";
import {
  getContract, getVault, listTemplates, listClauses, setContractStatus, deleteContract, logEvent,
} from "@/lib/contratos/api";
import { gerarContrato } from "@/lib/contratos/engine";
import type { Contract, ClientVault, ContractTemplate, ContractClause, ContractStatus } from "@/lib/contratos/types";
import { STATUS_LABEL, STATUS_COR } from "@/lib/contratos/types";
import {
  ArrowLeft2, Printer, Edit2, Trash, DocumentUpload, Send2,
} from "iconsax-react";

export const Route = createFileRoute("/contratos/$vaultId/contrato/$contractId")({ component: ContratoDetalhe });

const STATUS_OPCOES: ContractStatus[] = [
  "rascunho", "gerado", "enviado", "aguardando_assinatura", "assinado", "cancelado", "vencido",
];

function ContratoDetalhe() {
  const { vaultId, contractId } = Route.useParams();
  const navigate = useNavigate();
  const { empresa } = useAuth();

  const [contrato, setContrato] = useState<Contract | null>(null);
  const [vault, setVault] = useState<ClientVault | null>(null);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [clauses, setClauses] = useState<ContractClause[]>([]);
  const [loading, setLoading] = useState(true);
  const [anexar, setAnexar] = useState(false);

  const carregar = async () => {
    const [c, ts, cl] = await Promise.all([getContract(contractId), listTemplates(), listClauses()]);
    setContrato(c); setTemplates(ts); setClauses(cl);
    if (c) setVault(await getVault(c.client_vault_id));
    setLoading(false);
  };
  useEffect(() => { carregar(); /* eslint-disable-line */ }, [contractId]);

  // HTML: usa o salvo (gerado) ou re-renderiza ao vivo (rascunho)
  const html = useMemo(() => {
    if (!contrato) return "";
    if (contrato.rendered_html) return contrato.rendered_html;
    if (!vault) return "";
    const template = templates.find(t => t.id === contrato.template_id);
    const r = gerarContrato({
      allClauses: clauses,
      selectedSlugs: contrato.selected_clause_ids,
      templateType: template?.type ?? "",
      vault, form: contrato.form_data,
      contratada: { nome: empresa?.nome ?? "Contratada", cnpj: (empresa as any)?.cnpj ?? null },
    });
    return r.html;
  }, [contrato, vault, templates, clauses, empresa]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!contrato || !vault) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Contrato não encontrado.</p>
      <Link to="/contratos" className="mt-3 inline-block text-sm text-primary">← Voltar</Link>
    </div>
  );

  const mudarStatus = async (s: ContractStatus) => {
    await setContractStatus(contrato, s);
    carregar();
  };

  const imprimir = async () => {
    await logEvent({ client_vault_id: vaultId, contract_id: contrato.id, event_type: "pdf_baixado", description: "PDF gerado/impresso" });
    window.print();
  };

  const remover = async () => {
    if (!confirm("Excluir este contrato?")) return;
    await deleteContract(contrato);
    navigate({ to: "/contratos/$vaultId", params: { vaultId } });
  };

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-5 px-4 py-7 md:px-8 md:py-9">
      <Link to="/contratos/$vaultId" params={{ vaultId }} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft2 size={14} color="currentColor" variant="Linear" /> {vault.name}
      </Link>

      {/* Header + ações */}
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-xl font-bold tracking-tight">
              {contrato.numero ? `Nº ${String(contrato.numero).padStart(4, "0")} · ` : ""}{contrato.title}
            </h1>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COR[contrato.status])}>
              {STATUS_LABEL[contrato.status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Cliente: {vault.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={contrato.status} onValueChange={v => mudarStatus(v as ContractStatus)}>
            <SelectTrigger className="h-9 w-44 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPCOES.map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          {contrato.status === "rascunho" && (
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/contratos/$vaultId/novo", params: { vaultId } })} className="gap-1.5">
              <Edit2 size={13} color="currentColor" variant="Linear" /> Refazer
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={imprimir} className="gap-1.5">
            <Printer size={14} color="currentColor" variant="Linear" /> PDF / Imprimir
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAnexar(true)} className="gap-1.5">
            <DocumentUpload size={14} color="currentColor" variant="Linear" /> Anexar assinado
          </Button>
          <Button variant="outline" size="sm" disabled title="Integração de assinatura em breve" className="gap-1.5 opacity-50">
            <Send2 size={14} color="currentColor" variant="Linear" /> Enviar p/ assinatura
          </Button>
          <button onClick={remover} className="rounded-md p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive" title="Excluir">
            <Trash size={15} color="currentColor" variant="Linear" />
          </button>
        </div>
      </div>

      {/* Aviso assinatura */}
      <div className="rounded-lg border border-border/50 bg-surface-1/40 px-3 py-2 text-[11px] text-muted-foreground print:hidden">
        Assinatura digital (ClickSign/ZapSign/DocuSign) e geração de PDF nativa chegam em breve. Por enquanto, use “PDF / Imprimir” e anexe o documento assinado manualmente.
      </div>

      {/* Documento */}
      <ContratoPaper titulo={contrato.title} numero={contrato.numero} html={html} />

      <AnexarModal open={anexar} onClose={() => setAnexar(false)} vaultId={vaultId} contractId={contrato.id} onSaved={carregar} />
    </div>
  );
}
