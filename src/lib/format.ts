// Nervon — utilitários centrais de formatação (moeda, telefone, documentos, e-mail)
// Toda formatação visível ao usuário deve passar por aqui para manter consistência.

// ─── Moeda (BRL) ─────────────────────────────────────────────────────────────

/** Formata número como preço: 1500 → "R$ 1.500,00" (ou "R$ 1.500" sem casas). */
export function formatBRL(value: number, comCentavos = true): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: comCentavos ? 2 : 0,
    maximumFractionDigits: comCentavos ? 2 : 0,
  });
}

/**
 * Máscara de moeda baseada em centavos para inputs.
 * Os dígitos digitados são interpretados da direita p/ esquerda:
 *   "1"     → R$ 0,01
 *   "12345" → R$ 123,45
 */
export function maskCurrency(raw: string): { display: string; value: number } {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return { display: "", value: 0 };
  const value = parseInt(digits, 10) / 100;
  return { display: formatBRL(value, true), value };
}

/** Converte texto de moeda em número: "R$ 1.500,00" → 1500. */
export function parseBRL(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

// ─── Telefone (BR) ───────────────────────────────────────────────────────────

/** Máscara de telefone BR: "51999998888" → "(51) 99999-8888". */
export function maskPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Só os dígitos do telefone (para tel: / wa.me). */
export const unmaskPhone = (s: string) => s.replace(/\D/g, "");

// ─── E-mail ──────────────────────────────────────────────────────────────────

export function isValidEmail(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

// ─── Documentos (BR) ─────────────────────────────────────────────────────────

/** Máscara de CNPJ: "12345678000190" → "12.345.678/0001-90". */
export function maskCNPJ(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

/** Máscara de CPF: "12345678901" → "123.456.789-01". */
export function maskCPF(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/** Máscara de CEP: "90000000" → "90000-000". */
export function maskCEP(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 8);
  return d.replace(/^(\d{5})(\d)/, "$1-$2");
}
