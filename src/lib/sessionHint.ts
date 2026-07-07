import { createServerFn } from "@tanstack/react-start";

/**
 * Cookie auxiliar `mh_s=1`: DICA não sensível de que provavelmente existe uma
 * sessão persistida no navegador. Serve só para o SSR decidir entre landing
 * (visitante) e shell neutro (provável usuário logado) — NUNCA autentica,
 * autoriza ou libera dados. A sessão real é sempre confirmada pelo
 * AuthProvider via Supabase.
 */
export const SESSION_HINT_COOKIE = "mh_s";
const SESSION_HINT_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

/**
 * Leitura server-side da dica, pela API oficial do TanStack Start (getCookie).
 * Chamada no loader do __root durante o SSR; o valor é serializado junto com
 * o loader data, garantindo que servidor e primeira renderização do cliente
 * enxerguem exatamente o mesmo valor.
 */
export const getSessionHint = createServerFn({ method: "GET" }).handler(async () => {
  const { getCookie } = await import("@tanstack/react-start/server");
  return getCookie(SESSION_HINT_COOKIE) === "1";
});

function cookieAttrs(maxAge: number): string {
  // Secure em produção (https); em dev local (http) o atributo impediria a gravação
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  return `Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/** Cria/renova a dica após uma sessão válida ser confirmada no navegador. */
export function setSessionHintCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${SESSION_HINT_COOKIE}=1; ${cookieAttrs(SESSION_HINT_MAX_AGE)}`;
  } catch (err) {
    // Safari com armazenamento restrito pode bloquear cookies: a app segue
    // funcionando, só perde a otimização de SSR do shell neutro.
    console.warn("[auth] não foi possível gravar o cookie de dica de sessão:", err);
  }
}

/** Remove a dica no logout / sessão inexistente ou expirada. */
export function clearSessionHintCookie(): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${SESSION_HINT_COOKIE}=; ${cookieAttrs(0)}`;
  } catch (err) {
    console.warn("[auth] não foi possível limpar o cookie de dica de sessão:", err);
  }
}
