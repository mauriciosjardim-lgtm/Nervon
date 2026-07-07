// Motor de renderização de contratos.
// Monta cláusulas (obrigatórias + opcionais), resolve dependências,
// remove incompatibilidades, ordena, renumera e substitui variáveis.

import type { ClientVault, ContractClause, ContractFormData } from "./types";

const brl = (n?: number) =>
  (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtData = (s?: string) => {
  if (!s) return "";
  // aceita 'yyyy-mm-dd' ou ISO
  const d = new Date(s.length <= 10 ? `${s}T12:00:00` : s);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
};

export interface Contratada {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
}

// preenchimento em branco para campos não informados (linha pontilhada)
const BLANK = "__________";
const ou = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s || BLANK;
};

/** Constrói o mapa de variáveis {{CHAVE}} → valor. */
export function buildVariables(
  vault: ClientVault,
  form: ContractFormData,
  contratada: Contratada,
): Record<string, string> {
  const endereco = [vault.address, vault.city, vault.state, vault.zip_code]
    .filter(Boolean).join(", ");
  return {
    CLIENTE_NOME:           ou(vault.name),
    CLIENTE_DOCUMENTO:      ou(vault.document),
    CLIENTE_EMAIL:          ou(vault.email),
    CLIENTE_ENDERECO:       ou(endereco),
    CONTRATADA_NOME:        ou(contratada.nome),
    CONTRATADA_CNPJ:        ou(contratada.cnpj),
    CONTRATADA_ENDERECO:    ou(contratada.endereco),
    SERVICO_NOME:           ou(form.servico_nome),
    SERVICO_DESCRICAO:      ou(form.servico_descricao),
    VALOR_TOTAL:            brl(form.valor_total),
    FORMA_PAGAMENTO:        ou(form.forma_pagamento),
    NUMERO_PARCELAS:        ou(form.numero_parcelas),
    DATA_INICIO:            ou(fmtData(form.data_inicio)),
    DATA_FIM:               form.data_fim ? `O contrato encerra em ${fmtData(form.data_fim)}.` : "",
    PRAZO_ENTREGA:          ou(form.prazo_entrega),
    QUANTIDADE_ENTREGAVEIS: ou(form.quantidade_entregaveis),
    QUANTIDADE_REVISOES:    ou(form.quantidade_revisoes),
    MULTA_CANCELAMENTO:     ou(form.multa_cancelamento),
    CIDADE_FORO:            ou(form.cidade_foro || vault.city),
    DATA_GERACAO:           new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }),
  };
}

const appliesToType = (c: ContractClause, type: string) =>
  c.contract_types.includes("*") || c.contract_types.includes(type);

/**
 * Monta a lista final de cláusulas:
 * obrigatórias + opcionais selecionadas → resolve dependências →
 * remove incompatibilidades → filtra por tipo → ordena por order_base.
 */
export function assembleClauses(
  allClauses: ContractClause[],
  selectedSlugs: string[],
  templateType: string,
): ContractClause[] {
  const bySlug = new Map(allClauses.map(c => [c.slug, c]));
  const chosen = new Set<string>();

  for (const c of allClauses) {
    if (c.required && c.active && appliesToType(c, templateType)) chosen.add(c.slug);
  }
  for (const s of selectedSlugs) {
    const c = bySlug.get(s);
    if (c && c.active && appliesToType(c, templateType)) chosen.add(s);
  }

  // resolve dependências (adiciona o que faltar)
  let changed = true;
  while (changed) {
    changed = false;
    for (const s of [...chosen]) {
      const c = bySlug.get(s);
      if (!c) continue;
      for (const dep of c.depends_on) {
        if (!chosen.has(dep) && bySlug.has(dep)) { chosen.add(dep); changed = true; }
      }
    }
  }

  // remove incompatibilidades (mantém a obrigatória; entre opcionais, a de menor order_base)
  for (const s of [...chosen]) {
    const c = bySlug.get(s);
    if (!c || !chosen.has(s)) continue;
    for (const inc of c.incompatible_with) {
      if (!chosen.has(inc)) continue;
      const other = bySlug.get(inc);
      if (!other) continue;
      if (c.required && !other.required) chosen.delete(inc);
      else if (!c.required && other.required) chosen.delete(s);
      else chosen.delete(c.order_base <= other.order_base ? inc : s);
    }
  }

  return [...chosen]
    .map(s => bySlug.get(s)!)
    .filter(Boolean)
    .sort((a, b) => a.order_base - b.order_base);
}

function substitute(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? vars[k] : `{{${k}}}`));
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export interface NumberedClause {
  slug: string;
  numero: number;
  title: string;
  category: string;
  bodyRendered: string;
}

export interface RenderResult {
  html: string;
  text: string;
  numbered: NumberedClause[];
}

/** Renumera (com subcláusulas N.M) e substitui variáveis → HTML + texto. */
export function renderContract(
  clauses: ContractClause[],
  vars: Record<string, string>,
): RenderResult {
  const numbered: NumberedClause[] = clauses.map((c, i) => ({
    slug: c.slug,
    numero: i + 1,
    title: c.title,
    category: c.category,
    bodyRendered: substitute(c.body, vars),
  }));

  const paras = (body: string) => body.split("\n").map(p => p.trim()).filter(Boolean);

  const textParts: string[] = [];
  const htmlParts: string[] = [];

  for (const c of numbered) {
    const heading = `CLÁUSULA ${c.numero} - ${c.title.toUpperCase()}`;
    // a cláusula de assinaturas mantém o layout livre (linhas de assinatura)
    if (c.slug === "assinaturas") {
      textParts.push(`${heading}\n\n${c.bodyRendered}`);
      htmlParts.push(
        `<section class="mh-clause"><h3>${escapeHtml(heading)}</h3>` +
        `<p class="mh-sign">${escapeHtml(c.bodyRendered)}</p></section>`);
      continue;
    }
    const ps = paras(c.bodyRendered);
    textParts.push(
      `${heading}\n\n` + ps.map((p, j) => `${c.numero}.${j + 1}. ${p}`).join("\n"));
    htmlParts.push(
      `<section class="mh-clause"><h3>${escapeHtml(heading)}</h3>` +
      ps.map((p, j) =>
        `<p class="mh-sub"><span class="mh-num">${c.numero}.${j + 1}.</span> ${escapeHtml(p)}</p>`
      ).join("") +
      `</section>`);
  }

  return { html: htmlParts.join(""), text: textParts.join("\n\n"), numbered };
}

/**
 * Conveniência: monta + renderiza em uma chamada.
 */
export function gerarContrato(params: {
  allClauses: ContractClause[];
  selectedSlugs: string[];
  templateType: string;
  vault: ClientVault;
  form: ContractFormData;
  contratada: Contratada;
}): RenderResult & { assembled: ContractClause[] } {
  const assembled = assembleClauses(params.allClauses, params.selectedSlugs, params.templateType);
  const vars = buildVariables(params.vault, params.form, params.contratada);
  return { assembled, ...renderContract(assembled, vars) };
}
