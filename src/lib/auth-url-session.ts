import type { SupabaseClient } from "@supabase/supabase-js";

const AUTH_QUERY_KEYS = ["code", "error", "error_code", "error_description"];

/**
 * Entrega o retorno do Supabase ao client dono da rota.
 *
 * O fluxo atual usa PKCE (`?code=...`). O fallback por hash mantém válidos os
 * links implicit emitidos antes da mudança, sem permitir que o outro client
 * Supabase consuma a sessão.
 */
export async function consumeAuthSessionFromUrl(client: SupabaseClient) {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");

  if (code) {
    const result = await client.auth.exchangeCodeForSession(code);
    clearAuthCredentials(url);
    return result;
  }

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (accessToken && refreshToken) {
    const result = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    clearAuthCredentials(url);
    return result;
  }

  return client.auth.getSession();
}

function clearAuthCredentials(url: URL) {
  for (const key of AUTH_QUERY_KEYS) url.searchParams.delete(key);

  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const hasAuthHash =
    hash.has("access_token") ||
    hash.has("refresh_token") ||
    hash.has("expires_at") ||
    hash.has("token_type") ||
    hash.has("type");
  if (hasAuthHash) url.hash = "";

  window.history.replaceState(
    window.history.state,
    document.title,
    `${url.pathname}${url.search}${url.hash}`,
  );
}
