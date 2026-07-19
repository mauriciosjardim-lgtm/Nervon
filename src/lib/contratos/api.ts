// Camada de dados do módulo Contratos.
// As tabelas novas não estão no Database types gerado; o cast fica confinado aqui.

import { supabase } from "@/lib/supabase";
import { getEmpresaId } from "@/lib/empresaId";
import type {
  ClientVault,
  Contract,
  ContractClause,
  ContractTemplate,
  ClientFile,
  ContractEvent,
  ContractStatus,
  ContractFormData,
  FileCategory,
} from "./types";

// supabase tipado só conhece as tabelas antigas; confinamos o cast aqui
const sb = supabase as any;

// ── Cofres ──────────────────────────────────────────────────
export async function listVaults(): Promise<ClientVault[]> {
  const { data, error } = await sb
    .from("client_vaults")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientVault[];
}

export async function getVault(id: string): Promise<ClientVault | null> {
  const { data, error } = await sb.from("client_vaults").select("*").eq("id", id).single();
  if (error) return null;
  return data as ClientVault;
}

export async function createVault(input: Partial<ClientVault>): Promise<ClientVault> {
  const empresa_id = await getEmpresaId();
  const { data, error } = await sb
    .from("client_vaults")
    .insert({ ...input, empresa_id })
    .select("*")
    .single();
  if (error) throw error;
  await logEvent({
    client_vault_id: data.id,
    event_type: "cofre_criado",
    description: `Cofre de ${data.name} criado`,
  });
  return data as ClientVault;
}

export async function updateVault(id: string, patch: Partial<ClientVault>): Promise<void> {
  const { error } = await sb
    .from("client_vaults")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteVault(id: string): Promise<void> {
  const { error } = await sb.from("client_vaults").delete().eq("id", id);
  if (error) throw error;
}

// ── Biblioteca (modelos + cláusulas) ────────────────────────
export async function listTemplates(): Promise<ContractTemplate[]> {
  const { data, error } = await sb
    .from("contract_templates")
    .select("*")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return (data ?? []) as ContractTemplate[];
}

export async function listClauses(): Promise<ContractClause[]> {
  const { data, error } = await sb
    .from("contract_clauses")
    .select("*")
    .eq("active", true)
    .order("order_base");
  if (error) throw error;
  return (data ?? []) as ContractClause[];
}

// ── Contratos ───────────────────────────────────────────────
export async function listContracts(vaultId: string): Promise<Contract[]> {
  const { data, error } = await sb
    .from("contracts")
    .select("*")
    .eq("client_vault_id", vaultId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Contract[];
}

export async function getContract(id: string): Promise<Contract | null> {
  const { data, error } = await sb.from("contracts").select("*").eq("id", id).single();
  if (error) return null;
  return data as Contract;
}

async function proximoNumero(empresa_id: string): Promise<number> {
  const { data } = await sb
    .from("contracts")
    .select("numero")
    .eq("empresa_id", empresa_id)
    .order("numero", { ascending: false })
    .limit(1);
  const max = data?.[0]?.numero ?? 0;
  return max + 1;
}

export async function createContract(input: {
  client_vault_id: string;
  template_id: string | null;
  title: string;
  status: ContractStatus;
  form_data: ContractFormData;
  selected_clause_ids: string[];
  rendered_html?: string;
  rendered_text?: string;
}): Promise<Contract> {
  const empresa_id = await getEmpresaId();
  const numero = input.status === "rascunho" ? null : await proximoNumero(empresa_id);
  const { data, error } = await sb
    .from("contracts")
    .insert({ ...input, empresa_id, numero })
    .select("*")
    .single();
  if (error) throw error;
  await logEvent({
    client_vault_id: input.client_vault_id,
    contract_id: data.id,
    event_type: input.status === "rascunho" ? "contrato_criado" : "contrato_gerado",
    description: `Contrato "${data.title}" ${input.status === "rascunho" ? "salvo como rascunho" : "gerado"}`,
  });
  return data as Contract;
}

export async function updateContract(id: string, patch: Partial<Contract>): Promise<void> {
  const { error } = await sb
    .from("contracts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function setContractStatus(c: Contract, status: ContractStatus): Promise<void> {
  const patch: any = { status, updated_at: new Date().toISOString() };
  if (status !== "rascunho" && c.numero == null) {
    patch.numero = await proximoNumero(c.empresa_id);
  }
  const { error } = await sb.from("contracts").update(patch).eq("id", c.id);
  if (error) throw error;
  await logEvent({
    client_vault_id: c.client_vault_id,
    contract_id: c.id,
    event_type: "status_alterado",
    description: `Status alterado para ${status}`,
  });
}

export async function deleteContract(c: Contract): Promise<void> {
  const { error } = await sb.from("contracts").delete().eq("id", c.id);
  if (error) throw error;
}

// ── Arquivos ────────────────────────────────────────────────
export async function listFiles(vaultId: string): Promise<ClientFile[]> {
  const { data, error } = await sb
    .from("client_files")
    .select("*")
    .eq("client_vault_id", vaultId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClientFile[];
}

export async function addFile(input: {
  client_vault_id: string;
  contract_id?: string | null;
  name: string;
  file_url: string;
  file_type?: string | null;
  category: FileCategory;
}): Promise<ClientFile> {
  const empresa_id = await getEmpresaId();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await sb
    .from("client_files")
    .insert({ ...input, empresa_id, uploaded_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  await logEvent({
    client_vault_id: input.client_vault_id,
    contract_id: input.contract_id ?? null,
    event_type: "upload_manual",
    description: `Arquivo "${input.name}" anexado`,
  });
  return data as ClientFile;
}

// ── Histórico ───────────────────────────────────────────────
export async function listEvents(vaultId: string): Promise<ContractEvent[]> {
  const { data, error } = await sb
    .from("contract_events")
    .select("*")
    .eq("client_vault_id", vaultId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ContractEvent[];
}

export async function logEvent(input: {
  client_vault_id?: string | null;
  contract_id?: string | null;
  event_type: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const empresa_id = await getEmpresaId();
    await sb.from("contract_events").insert({
      empresa_id,
      client_vault_id: input.client_vault_id ?? null,
      contract_id: input.contract_id ?? null,
      event_type: input.event_type,
      description: input.description ?? null,
      metadata: input.metadata ?? {},
    });
  } catch {
    /* histórico é best-effort */
  }
}
