// Módulo Contratos — tipos de domínio e constantes

export type VaultType = "individual" | "company";

export type ContractStatus =
  | "rascunho" | "gerado" | "enviado"
  | "aguardando_assinatura" | "assinado" | "cancelado" | "vencido";

export type FileCategory =
  | "contrato_assinado" | "documento_cliente" | "proposta"
  | "briefing" | "comprovante" | "outro";

export interface ClientVault {
  id: string;
  empresa_id: string;
  name: string;
  fantasy_name: string | null;
  type: VaultType;
  document: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  responsible_name: string | null;
  notes: string | null;
  cliente_id: string | null;
  portal_enabled: boolean;
  portal_token: string | null;
  portal_welcome_message: string | null;
  portal_last_access_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContractTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  type: string;
  active: boolean;
}

export interface ContractClause {
  id: string;
  slug: string;
  category: string;
  title: string;
  body: string;
  order_base: number;
  required: boolean;
  active: boolean;
  variables: string[];
  depends_on: string[];
  incompatible_with: string[];
  contract_types: string[]; // slugs de template ou ["*"]
}

export interface ContractFormData {
  servico_nome?: string;
  servico_descricao?: string;
  valor_total?: number;
  forma_pagamento?: string;
  numero_parcelas?: number;
  data_inicio?: string;
  data_fim?: string;
  prazo_entrega?: string;
  quantidade_entregaveis?: number;
  quantidade_revisoes?: number;
  multa_cancelamento?: string;
  cidade_foro?: string;
  observacoes?: string;
}

export interface Contract {
  id: string;
  empresa_id: string;
  client_vault_id: string;
  template_id: string | null;
  numero: number | null;
  title: string;
  status: ContractStatus;
  form_data: ContractFormData;
  selected_clause_ids: string[]; // slugs
  rendered_html: string | null;
  rendered_text: string | null;
  pdf_url: string | null;
  signature_provider: string | null;
  signature_request_id: string | null;
  signature_url: string | null;
  signed_pdf_url: string | null;
  signed_at: string | null;
  cobranca_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientFile {
  id: string;
  empresa_id: string;
  client_vault_id: string;
  contract_id: string | null;
  name: string;
  file_url: string;
  file_type: string | null;
  category: FileCategory;
  uploaded_by: string | null;
  created_at: string;
}

export interface ContractEvent {
  id: string;
  empresa_id: string;
  client_vault_id: string | null;
  contract_id: string | null;
  event_type: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Labels e cores de status ────────────────────────────────
export const STATUS_LABEL: Record<ContractStatus, string> = {
  rascunho:              "Rascunho",
  gerado:                "Gerado",
  enviado:               "Enviado",
  aguardando_assinatura: "Aguardando assinatura",
  assinado:              "Assinado",
  cancelado:             "Cancelado",
  vencido:               "Vencido",
};

export const STATUS_COR: Record<ContractStatus, string> = {
  rascunho:              "bg-surface-3 text-muted-foreground",
  gerado:                "bg-blue-500/15 text-blue-400",
  enviado:               "bg-indigo-500/15 text-indigo-400",
  aguardando_assinatura: "bg-amber-500/15 text-amber-400",
  assinado:              "bg-primary/15 text-primary",
  cancelado:             "bg-red-500/15 text-red-400",
  vencido:               "bg-orange-500/15 text-orange-400",
};

export const FILE_CATEGORY_LABEL: Record<FileCategory, string> = {
  contrato_assinado: "Contrato assinado",
  documento_cliente: "Documento do cliente",
  proposta:          "Proposta",
  briefing:          "Briefing",
  comprovante:       "Comprovante",
  outro:             "Outro",
};
