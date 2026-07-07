import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CofreModal } from "@/components/contratos/cofre-modal";
import { AnexarModal } from "@/components/contratos/anexar-modal";
import {
  getVault, listContracts, listFiles, listEvents, deleteVault,
} from "@/lib/contratos/api";
import type { ClientVault, Contract, ClientFile, ContractEvent } from "@/lib/contratos/types";
import { STATUS_LABEL, STATUS_COR, FILE_CATEGORY_LABEL } from "@/lib/contratos/types";
import {
  ArrowLeft2, Add, Buildings2, Profile2User, Edit2, Trash, DocumentText1,
  DocumentDownload, Clock, ArrowRight2, Sms, Call, Location,
} from "iconsax-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/contratos/$vaultId/")({ component: VaultPage });

function VaultPage() {
  const { vaultId } = Route.useParams();
  const navigate = useNavigate();
  const [vault, setVault] = useState<ClientVault | null>(null);
  const [contratos, setContratos] = useState<Contract[]>([]);
  const [arquivos, setArquivos] = useState<ClientFile[]>([]);
  const [eventos, setEventos] = useState<ContractEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editar, setEditar] = useState(false);
  const [anexar, setAnexar] = useState(false);

  const carregar = useCallback(async () => {
    const v = await getVault(vaultId);
    setVault(v);
    if (v) {
      const [cs, fs, es] = await Promise.all([listContracts(vaultId), listFiles(vaultId), listEvents(vaultId)]);
      setContratos(cs); setArquivos(fs); setEventos(es);
    }
    setLoading(false);
  }, [vaultId]);

  useEffect(() => { carregar(); }, [carregar]);

  if (loading) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  if (!vault) return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">Cofre não encontrado.</p>
      <Link to="/contratos" className="mt-3 inline-block text-sm text-primary">← Voltar</Link>
    </div>
  );

  const stats = {
    total: contratos.length,
    rascunho: contratos.filter(c => c.status === "rascunho").length,
    assinado: contratos.filter(c => c.status === "assinado").length,
    aguardando: contratos.filter(c => c.status === "aguardando_assinatura" || c.status === "enviado").length,
  };

  const removerCofre = async () => {
    if (!confirm(`Excluir o cofre de "${vault.name}"? Todos os contratos e arquivos vinculados serão removidos.`)) return;
    await deleteVault(vault.id);
    navigate({ to: "/contratos" });
  };

  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-5 px-4 py-7 md:px-8 md:py-9">
      {/* Voltar + header */}
      <Link to="/contratos" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft2 size={14} color="currentColor" variant="Linear" /> Contratos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            {vault.type === "company"
              ? <Buildings2 size={22} color="currentColor" variant="Linear" />
              : <Profile2User size={22} color="currentColor" variant="Linear" />}
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{vault.name}</h1>
            <p className="text-xs text-muted-foreground">
              {vault.fantasy_name ? `${vault.fantasy_name} · ` : ""}{vault.type === "company" ? "Pessoa Jurídica" : "Pessoa Física"}
              {vault.document ? ` · ${vault.document}` : ""}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditar(true)} className="gap-1.5">
            <Edit2 size={14} color="currentColor" variant="Linear" /> Editar
          </Button>
          <Button size="sm" onClick={() => navigate({ to: "/contratos/$vaultId/novo", params: { vaultId } })} className="gap-1.5">
            <Add size={14} color="currentColor" variant="Linear" /> Novo contrato
          </Button>
        </div>
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="resumo">Resumo</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="contratos">Contratos {stats.total > 0 && <span className="ml-1 text-[10px] opacity-60">{stats.total}</span>}</TabsTrigger>
          <TabsTrigger value="arquivos">Arquivos {arquivos.length > 0 && <span className="ml-1 text-[10px] opacity-60">{arquivos.length}</span>}</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo" className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Contratos" value={stats.total} />
            <StatCard label="Rascunhos" value={stats.rascunho} />
            <StatCard label="Aguardando" value={stats.aguardando} />
            <StatCard label="Assinados" value={stats.assinado} accent />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoCard titulo="Dados principais">
              <InfoLinha icon={Sms} label="E-mail" valor={vault.email} />
              <InfoLinha icon={Call} label="Telefone" valor={vault.phone} />
              <InfoLinha icon={Location} label="Endereço" valor={[vault.address, vault.city, vault.state].filter(Boolean).join(", ")} />
              <InfoLinha icon={Profile2User} label="Responsável" valor={vault.responsible_name} />
            </InfoCard>
            <InfoCard titulo="Arquivos vinculados">
              {arquivos.length === 0
                ? <p className="text-xs text-muted-foreground">Nenhum arquivo ainda.</p>
                : <ul className="space-y-1.5">
                    {arquivos.slice(0, 5).map(a => (
                      <li key={a.id} className="flex items-center gap-2 text-xs">
                        <DocumentText1 size={13} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
                        <span className="truncate">{a.name}</span>
                        <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{FILE_CATEGORY_LABEL[a.category]}</span>
                      </li>
                    ))}
                  </ul>}
            </InfoCard>
          </div>
        </TabsContent>

        {/* DADOS */}
        <TabsContent value="dados" className="pt-4">
          <div className="rounded-2xl border border-border bg-surface-1/50 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold">Dados do cliente</h2>
              <Button variant="outline" size="sm" onClick={() => setEditar(true)} className="gap-1.5">
                <Edit2 size={13} color="currentColor" variant="Linear" /> Editar
              </Button>
            </div>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              <Campo label={vault.type === "company" ? "Razão social" : "Nome completo"} valor={vault.name} />
              <Campo label={vault.type === "company" ? "Nome fantasia" : "Apelido"} valor={vault.fantasy_name} />
              <Campo label={vault.type === "company" ? "CNPJ" : "CPF"} valor={vault.document} />
              <Campo label="Responsável" valor={vault.responsible_name} />
              <Campo label="E-mail" valor={vault.email} />
              <Campo label="Telefone / WhatsApp" valor={vault.phone} />
              <Campo label="Endereço" valor={vault.address} />
              <Campo label="Cidade" valor={vault.city} />
              <Campo label="Estado" valor={vault.state} />
              <Campo label="CEP" valor={vault.zip_code} />
              <Campo label="Observações internas" valor={vault.notes} full />
            </dl>
            <div className="mt-5 border-t border-border/40 pt-4">
              <button onClick={removerCofre} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition hover:text-destructive">
                <Trash size={13} color="currentColor" variant="Linear" /> Excluir cofre
              </button>
            </div>
          </div>
        </TabsContent>

        {/* CONTRATOS */}
        <TabsContent value="contratos" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => navigate({ to: "/contratos/$vaultId/novo", params: { vaultId } })} className="gap-1.5">
              <Add size={14} color="currentColor" variant="Linear" /> Novo contrato
            </Button>
          </div>
          {contratos.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 px-6 py-14 text-center">
              <DocumentText1 size={22} color="currentColor" variant="Linear" className="mb-2 text-primary" />
              <p className="text-sm font-semibold">Nenhum contrato ainda</p>
              <p className="mt-1 text-xs text-muted-foreground">Crie o primeiro contrato deste cliente.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50">
              {contratos.map(c => (
                <li key={c.id}>
                  <Link to="/contratos/$vaultId/contrato/$contractId" params={{ vaultId, contractId: c.id }}
                    className="flex items-center gap-3 bg-surface-1/40 px-4 py-3 transition hover:bg-surface-2/40">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-muted-foreground">
                      <DocumentText1 size={16} color="currentColor" variant="Linear" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {c.numero ? `Nº ${String(c.numero).padStart(4, "0")} · ` : ""}{c.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(c.created_at), "dd MMM yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COR[c.status])}>
                      {STATUS_LABEL[c.status]}
                    </span>
                    <ArrowRight2 size={15} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground/40" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* ARQUIVOS */}
        <TabsContent value="arquivos" className="space-y-3 pt-4">
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={() => setAnexar(true)} className="gap-1.5">
              <Add size={14} color="currentColor" variant="Linear" /> Anexar arquivo
            </Button>
          </div>
          {arquivos.length === 0 ? (
            <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 px-6 py-14 text-center">
              <DocumentDownload size={22} color="currentColor" variant="Linear" className="mb-2 text-primary" />
              <p className="text-sm font-semibold">Nenhum arquivo</p>
              <p className="mt-1 text-xs text-muted-foreground">Anexe contratos assinados, documentos, propostas e comprovantes.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/50">
              {arquivos.map(a => (
                <li key={a.id} className="flex items-center gap-3 bg-surface-1/40 px-4 py-3">
                  <DocumentText1 size={16} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium hover:text-primary">{a.name}</a>
                    <p className="text-[11px] text-muted-foreground">{FILE_CATEGORY_LABEL[a.category]} · {format(new Date(a.created_at), "dd MMM yyyy", { locale: ptBR })}</p>
                  </div>
                  <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground">
                    <DocumentDownload size={15} color="currentColor" variant="Linear" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        {/* HISTÓRICO */}
        <TabsContent value="historico" className="pt-4">
          {eventos.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">Nenhum evento registrado ainda.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border/50 pl-5">
              {eventos.map(e => (
                <li key={e.id} className="relative">
                  <span className="absolute -left-[1.42rem] top-1 grid size-3 place-items-center rounded-full border-2 border-background bg-primary" />
                  <p className="text-sm text-foreground/90">{e.description || e.event_type}</p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock size={11} color="currentColor" variant="Linear" />
                    {format(new Date(e.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>

      <CofreModal open={editar} onClose={() => setEditar(false)} vault={vault} onSaved={() => carregar()} />
      <AnexarModal open={anexar} onClose={() => setAnexar(false)} vaultId={vaultId} onSaved={() => carregar()} />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-1/70 p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 font-display text-2xl font-bold tabular-nums", accent && "text-primary")}>{value}</p>
    </div>
  );
}

function InfoCard({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1/50 p-5">
      <h3 className="mb-3 font-display text-sm font-semibold">{titulo}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function InfoLinha({ icon: Icon, label, valor }: { icon: any; label: string; valor: string | null }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon size={13} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="truncate text-foreground/90">{valor || "—"}</span>
    </div>
  );
}

function Campo({ label, valor, full }: { label: string; valor: string | null; full?: boolean }) {
  return (
    <div className={cn(full && "sm:col-span-2")}>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground/90">{valor || "—"}</dd>
    </div>
  );
}
