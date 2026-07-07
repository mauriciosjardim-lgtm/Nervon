import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CofreModal } from "@/components/contratos/cofre-modal";
import { DadosEmpresaModal } from "@/components/contratos/dados-empresa-modal";
import { ExcluirCofreModal } from "@/components/contratos/excluir-cofre-modal";
import { listVaults, listContracts } from "@/lib/contratos/api";
import type { ClientVault, Contract } from "@/lib/contratos/types";
import { STATUS_LABEL, STATUS_COR } from "@/lib/contratos/types";
import {
  Add, SearchNormal, DocumentText1, Buildings2, Profile2User, ArrowRight2, Setting2, CloseCircle,
} from "iconsax-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/contratos/")({ component: ContratosIndex });

interface VaultComStats extends ClientVault {
  totalContratos: number;
  ultimoContrato: Contract | null;
  statusGeral: Contract["status"] | null;
}

function ContratosIndex() {
  const navigate = useNavigate();
  const [vaults, setVaults] = useState<VaultComStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [dadosEmpresa, setDadosEmpresa] = useState(false);
  const [excluir, setExcluir] = useState<ClientVault | null>(null);

  const carregar = async () => {
    setLoading(true);
    const vs = await listVaults();
    // stats por cofre (contratos)
    const comStats = await Promise.all(vs.map(async v => {
      const cs = await listContracts(v.id);
      return {
        ...v,
        totalContratos: cs.length,
        ultimoContrato: cs[0] ?? null,
        statusGeral: cs[0]?.status ?? null,
      } as VaultComStats;
    }));
    setVaults(comStats);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, []);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return vaults;
    return vaults.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.fantasy_name ?? "").toLowerCase().includes(q) ||
      (v.document ?? "").toLowerCase().includes(q));
  }, [vaults, busca]);

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 py-7 md:px-8 md:py-9">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-xs text-muted-foreground">
            {vaults.length} {vaults.length === 1 ? "cofre de cliente" : "cofres de clientes"} · cada cliente guarda seus contratos e arquivos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDadosEmpresa(true)} className="h-9 gap-2 rounded-lg">
            <Setting2 size={15} color="currentColor" variant="Linear" /> Minha empresa
          </Button>
          <Button onClick={() => setModalAberto(true)} className="h-9 gap-2 rounded-lg">
            <Add size={16} color="currentColor" variant="Linear" /> Novo cofre
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <SearchNormal size={15} color="currentColor" variant="Linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar cliente, fantasia ou documento…" className="pl-9" />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">Carregando…</div>
      ) : filtrados.length === 0 ? (
        <EmptyState onNew={() => setModalAberto(true)} temBusca={!!busca} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map(v => (
            <div key={v.id}
              role="button" tabIndex={0}
              onClick={() => navigate({ to: "/contratos/$vaultId", params: { vaultId: v.id } })}
              onKeyDown={e => { if (e.key === "Enter") navigate({ to: "/contratos/$vaultId", params: { vaultId: v.id } }); }}
              className="group relative flex cursor-pointer flex-col rounded-2xl border border-border bg-surface-1/50 p-4 text-left transition hover:border-primary/40 hover:bg-surface-1/70">
              <button
                onClick={e => { e.stopPropagation(); setExcluir(v); }}
                title="Excluir cofre"
                className="absolute right-2 top-2 z-10 inline-flex size-6 items-center justify-center rounded-full bg-surface-2 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/80 hover:text-white"
              >
                <CloseCircle size={14} color="currentColor" variant="Linear" />
              </button>
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  {v.type === "company"
                    ? <Buildings2 size={18} color="currentColor" variant="Linear" />
                    : <Profile2User size={18} color="currentColor" variant="Linear" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold group-hover:text-primary">{v.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {v.fantasy_name || (v.type === "company" ? "Pessoa Jurídica" : "Pessoa Física")}
                  </p>
                </div>
                <ArrowRight2 size={16} color="currentColor" variant="Linear" className="shrink-0 text-muted-foreground/40 transition group-hover:text-primary" />
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <DocumentText1 size={13} color="currentColor" variant="Linear" />
                  {v.totalContratos} {v.totalContratos === 1 ? "contrato" : "contratos"}
                </span>
                {v.statusGeral
                  ? <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COR[v.statusGeral])}>{STATUS_LABEL[v.statusGeral]}</span>
                  : <span className="text-[10px] text-muted-foreground/60">sem contratos</span>}
              </div>
              {v.ultimoContrato && (
                <p className="mt-1.5 text-[10px] text-muted-foreground/70">
                  Último: {format(new Date(v.ultimoContrato.created_at), "dd MMM yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <CofreModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSaved={(novo) => { if (novo) navigate({ to: "/contratos/$vaultId", params: { vaultId: novo.id } }); else carregar(); }}
      />
      <DadosEmpresaModal open={dadosEmpresa} onClose={() => setDadosEmpresa(false)} />
      <ExcluirCofreModal
        vault={excluir}
        open={!!excluir}
        onClose={() => setExcluir(null)}
        onDeleted={carregar}
      />
    </div>
  );
}

function EmptyState({ onNew, temBusca }: { onNew: () => void; temBusca: boolean }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border/60 bg-surface-1/30 px-6 py-16 text-center">
      <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <DocumentText1 size={24} color="currentColor" variant="Linear" />
      </div>
      <p className="text-sm font-semibold">{temBusca ? "Nenhum cliente encontrado" : "Nenhum cofre de cliente ainda"}</p>
      <p className="mt-1 max-w-xs text-xs text-muted-foreground">
        {temBusca ? "Tente outro termo de busca." : "Crie um cofre para guardar os dados, contratos e arquivos de cada cliente."}
      </p>
      {!temBusca && (
        <Button onClick={onNew} className="mt-4 h-9 gap-2 rounded-lg">
          <Add size={14} color="currentColor" variant="Linear" /> Criar primeiro cofre
        </Button>
      )}
    </div>
  );
}
