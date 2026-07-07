// Planos e limites de uso mensal.
// Os limites são AJUSTÁVEIS — fecharemos os números do Apify/assinatura depois.

export type Plano = "free" | "pro";
export type Recurso = "contratos" | "assinaturas" | "prospeccoes";

export const PLANO_LABEL: Record<Plano, string> = {
  free: "Grátis",
  pro:  "Pro",
};

// Limite mensal por recurso. -1 = ilimitado, 0 = bloqueado no plano.
export const LIMITES: Record<Plano, Record<Recurso, number>> = {
  free: { contratos: 2,  assinaturas: 0,  prospeccoes: 0 },
  pro:  { contratos: 15, assinaturas: 15, prospeccoes: 20 },
};

export const RECURSO_LABEL: Record<Recurso, string> = {
  contratos:   "Contratos",
  assinaturas: "Assinaturas digitais",
  prospeccoes: "Prospecções",
};

export function normalizarPlano(p: string | null | undefined): Plano {
  return p === "pro" ? "pro" : "free";
}

export function limite(plano: Plano, recurso: Recurso): number {
  return LIMITES[plano]?.[recurso] ?? 0;
}

/** Pode usar mais 1 unidade do recurso, dado o uso atual no mês? */
export function podeUsar(plano: Plano, recurso: Recurso, usoAtual: number): boolean {
  const l = limite(plano, recurso);
  if (l === -1) return true;
  return usoAtual < l;
}

/** Texto curto "3 / 15" para exibir uso. */
export function rotuloUso(plano: Plano, recurso: Recurso, usoAtual: number): string {
  const l = limite(plano, recurso);
  return l === -1 ? `${usoAtual}` : `${usoAtual} / ${l}`;
}
