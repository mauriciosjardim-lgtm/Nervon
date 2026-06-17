/**
 * Nervon MCP — servidor remoto + OAuth (Cloudflare Worker)
 * ============================================================================
 * Expõe as ferramentas do CRM Nervon para o Claude de cada produtora.
 *
 * Dois jeitos de conectar:
 *  1) Token fixo (Claude Code):  Authorization: Bearer nvn_...
 *  2) OAuth (Claude Desktop):    o cliente clica "adicionar conector", faz
 *     login no Nervon e autoriza — sem copiar token nenhum.
 *
 * O OAuth aqui é "sem estado": os códigos e client_ids são tokens HMAC
 * assinados (não precisa de KV/banco extra). No fim do login, geramos um
 * token nvn_ normal (hash salvo em mcp_tokens) e ele VIRA o access_token do
 * OAuth — então o endpoint MCP continua idêntico (valida o nvn_ via hash).
 *
 * Segurança: nenhuma service role key. As funções SECURITY DEFINER no Postgres
 * validam o token e resolvem a empresa.
 * ============================================================================
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  OAUTH_SIGNING_KEY: string; // segredo p/ assinar códigos OAuth (wrangler secret)
}

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "nervon", version: "2.0.0" };
const CODE_TTL_SECONDS = 600; // código de autorização válido por 10 min

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id, WWW-Authenticate",
};

// ─── Ferramentas (JSON Schema p/ o cliente) ─────────────────────────────────
const TOOLS = [
  {
    name: "criar_lead",
    description:
      "Cria uma nova oportunidade (lead) no CRM Nervon da produtora. Use ao encontrar um possível cliente para a produtora de audiovisual.",
    inputSchema: {
      type: "object",
      properties: {
        empresa: { type: "string", description: "Nome da empresa/cliente do lead (ex: 'Padaria Pão Quente')" },
        contato: { type: "string", description: "Nome da pessoa de contato (ex: 'João Silva')" },
        email: { type: "string", description: "E-mail do contato" },
        telefone: { type: "string", description: "Telefone do contato" },
        valor: { type: "number", description: "Valor estimado da oportunidade em reais" },
        origem: { type: "string", description: "Origem do lead (ex: 'Instagram', 'Indicação')" },
        temperatura: { type: "string", enum: ["frio", "morno", "quente"], description: "Temperatura do lead" },
        segmento: { type: "string", description: "Segmento do cliente (ex: 'Gastronomia')" },
        cidade: { type: "string", description: "Cidade do cliente" },
      },
      required: ["empresa", "contato"],
    },
  },
  {
    name: "listar_leads",
    description: "Lista os leads do funil comercial da produtora no Nervon. Opcionalmente filtra por etapa.",
    inputSchema: {
      type: "object",
      properties: {
        etapa: {
          type: "string",
          enum: ["novo", "diagnostico", "reuniao", "proposta", "negociacao", "fechado", "perdido"],
          description: "Filtrar por uma etapa específica do funil (opcional)",
        },
      },
    },
  },
  {
    name: "mover_etapa",
    description: "Move um lead para outra etapa do funil comercial no Nervon.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "ID do lead (obtido via listar_leads)" },
        etapa: {
          type: "string",
          enum: ["novo", "diagnostico", "reuniao", "proposta", "negociacao", "fechado", "perdido"],
          description: "Nova etapa do funil",
        },
      },
      required: ["lead_id", "etapa"],
    },
  },
];

// ─── Utils cripto / base64url ────────────────────────────────────────────────
function b64urlFromBytes(bytes: Uint8Array): string {
  let s = btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s: string): Uint8Array {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = s.length % 4 ? "=".repeat(4 - (s.length % 4)) : "";
  const bin = atob(s + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function b64urlJson(obj: unknown): string {
  return b64urlFromBytes(new TextEncoder().encode(JSON.stringify(obj)));
}
async function sha256Bytes(input: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
}
async function sha256Hex(input: string): Promise<string> {
  return [...(await sha256Bytes(input))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}
/** Cria um token assinado: base64url(payload).base64url(hmac) */
async function signToken(secret: string, payload: object): Promise<string> {
  const key = await hmacKey(secret);
  const body = b64urlJson(payload);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `${body}.${b64urlFromBytes(sig)}`;
}
/** Verifica e devolve o payload, ou null se inválido. */
async function verifyToken<T = any>(secret: string, token: string): Promise<T | null> {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const key = await hmacKey(secret);
  const ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), new TextEncoder().encode(body));
  if (!ok) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as T;
  } catch {
    return null;
  }
}

function genNvnToken(): string {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return "nvn_" + [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

// ─── Supabase (REST/Auth via fetch, só com a chave anon) ─────────────────────
async function callRpc(env: Env, fn: string, body: Record<string, unknown>, userJwt?: string): Promise<unknown> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${userJwt ?? env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase RPC ${fn} (${res.status}): ${await res.text()}`);
  return res.json();
}

/** Login com e-mail/senha → devolve o JWT do usuário, ou null. */
async function supabasePasswordLogin(env: Env, email: string, password: string): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return null;
  const data: any = await res.json();
  return data?.access_token ?? null;
}

/** Insere um token nvn_ (hash) na empresa do usuário, via RLS. */
async function inserirTokenDaEmpresa(env: Env, userJwt: string, empresaId: string, tokenHash: string): Promise<boolean> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/mcp_tokens`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${userJwt}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ empresa_id: empresaId, token_hash: tokenHash, nome: "Claude (conector)" }),
  });
  return res.ok;
}

// ─── MCP (JSON-RPC) ───────────────────────────────────────────────────────────
function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function toolText(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

async function runTool(env: Env, tokenHash: string, name: string, args: Record<string, any>) {
  switch (name) {
    case "criar_lead": {
      const r: any = await callRpc(env, "mcp_criar_lead", {
        p_token_hash: tokenHash,
        p_empresa: args.empresa,
        p_contato: args.contato,
        p_email: args.email ?? null,
        p_telefone: args.telefone ?? null,
        p_valor: args.valor ?? 0,
        p_origem: args.origem ?? "Agente IA",
        p_temperatura: args.temperatura ?? "morno",
        p_segmento: args.segmento ?? null,
        p_cidade: args.cidade ?? null,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao criar lead.", true);
      return toolText(`Lead criado no Nervon: "${r.cliente}" (contato: ${r.contato}). ID: ${r.lead_id}`);
    }
    case "listar_leads": {
      const r: any = await callRpc(env, "mcp_listar_leads", { p_token_hash: tokenHash, p_etapa: args.etapa ?? null });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao listar leads.", true);
      const leads = r.leads ?? [];
      return toolText(leads.length === 0 ? "Nenhum lead encontrado." : JSON.stringify(leads, null, 2));
    }
    case "mover_etapa": {
      const r: any = await callRpc(env, "mcp_mover_etapa", {
        p_token_hash: tokenHash,
        p_lead_id: args.lead_id,
        p_etapa: args.etapa,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao mover etapa.", true);
      return toolText(`Lead ${r.lead_id} movido para a etapa "${r.etapa}".`);
    }
    default:
      return toolText(`Ferramenta desconhecida: ${name}`, true);
  }
}

async function handleRpc(env: Env, tokenHash: string, msg: any): Promise<unknown | null> {
  const { id, method, params } = msg ?? {};
  switch (method) {
    case "initialize":
      return jsonRpcResult(id, {
        protocolVersion: params?.protocolVersion ?? PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    case "notifications/initialized":
    case "notifications/cancelled":
      return null;
    case "ping":
      return jsonRpcResult(id, {});
    case "tools/list":
      return jsonRpcResult(id, { tools: TOOLS });
    case "tools/call": {
      try {
        return jsonRpcResult(id, await runTool(env, tokenHash, params?.name, params?.arguments ?? {}));
      } catch (e: any) {
        return jsonRpcResult(id, toolText(`Erro: ${e?.message ?? e}`, true));
      }
    }
    default:
      return jsonRpcError(id, -32601, `Método não suportado: ${method}`);
  }
}

// ─── OAuth: metadata ─────────────────────────────────────────────────────────
function protectedResourceMetadata(base: string) {
  return {
    resource: base,
    authorization_servers: [base],
    bearer_methods_supported: ["header"],
    scopes_supported: ["mcp"],
  };
}
function authServerMetadata(base: string) {
  return {
    issuer: base,
    authorization_endpoint: `${base}/authorize`,
    token_endpoint: `${base}/token`,
    registration_endpoint: `${base}/register`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
  };
}

// ─── OAuth: registro dinâmico de cliente (RFC 7591) ──────────────────────────
async function handleRegister(env: Env, request: Request): Promise<Response> {
  let body: any = {};
  try {
    body = await request.json();
  } catch {}
  const redirectUris: string[] = Array.isArray(body?.redirect_uris) ? body.redirect_uris : [];
  if (redirectUris.length === 0) {
    return Response.json({ error: "invalid_redirect_uri", error_description: "redirect_uris obrigatório" }, { status: 400, headers: CORS });
  }
  // client_id = token assinado contendo as redirect_uris registradas (sem estado).
  const clientId = await signToken(env.OAUTH_SIGNING_KEY, { ru: redirectUris, t: "client", iat: Date.now() });
  return Response.json(
    {
      client_id: clientId,
      redirect_uris: redirectUris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
      client_name: body?.client_name ?? "Claude",
    },
    { status: 201, headers: CORS },
  );
}

// ─── OAuth: tela de login/consentimento ──────────────────────────────────────
function loginPage(params: Record<string, string>, erro?: string): Response {
  const hidden = ["client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"]
    .map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(params[k] ?? "")}">`)
    .join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conectar ao Nervon</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0a0a0b; color:#e7e7ea;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif; padding:24px; }
  .card { width:100%; max-width:380px; background:#141416; border:1px solid #26262b; border-radius:20px;
    padding:32px 28px; box-shadow:0 24px 60px -20px rgba(0,0,0,.6); }
  .logo { width:48px; height:48px; border-radius:12px; background:#c4f000; color:#0a0a0b; display:grid;
    place-items:center; font-weight:800; font-size:24px; margin:0 auto 16px; box-shadow:0 0 28px -4px #c4f000; }
  h1 { font-size:18px; text-align:center; margin:0 0 4px; }
  p.sub { font-size:13px; color:#9a9aa2; text-align:center; margin:0 0 24px; }
  label { display:block; font-size:12px; color:#9a9aa2; margin:0 0 6px; }
  input.field { width:100%; height:42px; padding:0 12px; margin-bottom:14px; border-radius:10px;
    border:1px solid #2e2e34; background:#0e0e10; color:#e7e7ea; font-size:14px; }
  input.field:focus { outline:none; border-color:#c4f000; }
  button { width:100%; height:44px; border:0; border-radius:10px; background:#c4f000; color:#0a0a0b;
    font-weight:700; font-size:14px; cursor:pointer; }
  button:hover { filter:brightness(1.05); }
  .erro { background:#3a1416; border:1px solid #5a2326; color:#ffb4b4; font-size:12px; padding:10px 12px;
    border-radius:10px; margin-bottom:16px; }
  .foot { font-size:11px; color:#6b6b72; text-align:center; margin-top:18px; line-height:1.5; }
</style></head><body>
  <form class="card" method="POST" action="/authorize">
    <div class="logo">N</div>
    <h1>Conectar ao Nervon</h1>
    <p class="sub">Entre com sua conta para autorizar o Claude a acessar seu CRM.</p>
    ${erro ? `<div class="erro">${escapeHtml(erro)}</div>` : ""}
    ${hidden}
    <label>E-mail</label>
    <input class="field" type="email" name="email" placeholder="voce@produtora.com" required autofocus>
    <label>Senha</label>
    <input class="field" type="password" name="password" placeholder="••••••••" required>
    <button type="submit">Entrar e autorizar</button>
    <p class="foot">O Claude poderá criar e consultar leads no seu funil.<br>Você pode revogar o acesso a qualquer momento em Configurações → Agente IA.</p>
  </form>
</body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", ...CORS } });
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── OAuth: GET /authorize (mostra form) ─────────────────────────────────────
async function handleAuthorizeGet(env: Env, url: URL): Promise<Response> {
  const p = Object.fromEntries(url.searchParams.entries());
  if (p.response_type !== "code") return badAuthorize("response_type deve ser 'code'");
  if (p.code_challenge_method !== "S256") return badAuthorize("PKCE S256 obrigatório");
  const client = await verifyToken<any>(env.OAUTH_SIGNING_KEY, p.client_id ?? "");
  if (!client || client.t !== "client") return badAuthorize("client_id inválido");
  if (!client.ru.includes(p.redirect_uri)) return badAuthorize("redirect_uri não registrado");
  return loginPage(p);
}
function badAuthorize(msg: string): Response {
  return new Response(`Erro de autorização: ${msg}`, { status: 400, headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
}

// ─── OAuth: POST /authorize (faz login, emite código) ────────────────────────
async function handleAuthorizePost(env: Env, request: Request): Promise<Response> {
  const form = new URLSearchParams(await request.text());
  const p = Object.fromEntries(form.entries());

  const client = await verifyToken<any>(env.OAUTH_SIGNING_KEY, p.client_id ?? "");
  if (!client || client.t !== "client" || !client.ru.includes(p.redirect_uri)) return badAuthorize("client_id/redirect_uri inválido");

  // 1. login no Supabase
  const jwt = await supabasePasswordLogin(env, p.email ?? "", p.password ?? "");
  if (!jwt) return loginPage(p, "E-mail ou senha incorretos.");

  // 2. resolve a empresa
  let empresaId: string | null = null;
  try {
    empresaId = (await callRpc(env, "minha_empresa_id", {}, jwt)) as string;
  } catch {}
  if (!empresaId) return loginPage(p, "Sua conta ainda não tem uma produtora. Faça o onboarding no app primeiro.");

  // 3. gera o token nvn_ e salva o hash na empresa (via RLS, com o JWT do usuário)
  const nvn = genNvnToken();
  const ok = await inserirTokenDaEmpresa(env, jwt, empresaId, await sha256Hex(nvn));
  if (!ok) return loginPage(p, "Não foi possível criar o acesso. Tente novamente.");

  // 4. emite o código de autorização (assinado, com TTL) e redireciona
  const code = await signToken(env.OAUTH_SIGNING_KEY, {
    t: "code",
    nvn,
    cc: p.code_challenge,
    ru: p.redirect_uri,
    exp: Date.now() + CODE_TTL_SECONDS * 1000,
  });
  const redirect = new URL(p.redirect_uri);
  redirect.searchParams.set("code", code);
  if (p.state) redirect.searchParams.set("state", p.state);
  return new Response(null, { status: 302, headers: { Location: redirect.toString(), ...CORS } });
}

// ─── OAuth: POST /token (troca código por access_token) ───────────────────────
async function handleToken(env: Env, request: Request): Promise<Response> {
  const ct = request.headers.get("content-type") ?? "";
  let p: Record<string, string> = {};
  if (ct.includes("application/json")) {
    p = (await request.json().catch(() => ({}))) as any;
  } else {
    p = Object.fromEntries(new URLSearchParams(await request.text()).entries());
  }

  if (p.grant_type !== "authorization_code")
    return Response.json({ error: "unsupported_grant_type" }, { status: 400, headers: CORS });

  const code = await verifyToken<any>(env.OAUTH_SIGNING_KEY, p.code ?? "");
  if (!code || code.t !== "code") return Response.json({ error: "invalid_grant", error_description: "código inválido" }, { status: 400, headers: CORS });
  if (Date.now() > code.exp) return Response.json({ error: "invalid_grant", error_description: "código expirado" }, { status: 400, headers: CORS });
  if (p.redirect_uri && p.redirect_uri !== code.ru)
    return Response.json({ error: "invalid_grant", error_description: "redirect_uri não confere" }, { status: 400, headers: CORS });

  // PKCE: base64url(sha256(code_verifier)) deve bater com o code_challenge
  const expected = b64urlFromBytes(await sha256Bytes(p.code_verifier ?? ""));
  if (expected !== code.cc) return Response.json({ error: "invalid_grant", error_description: "PKCE inválido" }, { status: 400, headers: CORS });

  // O access_token É o token nvn_ (o endpoint MCP já sabe validá-lo).
  return Response.json(
    { access_token: code.nvn, token_type: "Bearer", scope: "mcp" },
    { headers: { ...CORS, "Cache-Control": "no-store" } },
  );
}

// ─── Entrada ──────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const base = url.origin;
    const path = url.pathname;

    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    // Descoberta OAuth
    if (path === "/.well-known/oauth-protected-resource")
      return Response.json(protectedResourceMetadata(base), { headers: CORS });
    if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration")
      return Response.json(authServerMetadata(base), { headers: CORS });

    // Endpoints OAuth
    if (path === "/register" && request.method === "POST") return handleRegister(env, request);
    if (path === "/authorize" && request.method === "GET") return handleAuthorizeGet(env, url);
    if (path === "/authorize" && request.method === "POST") return handleAuthorizePost(env, request);
    if (path === "/token" && request.method === "POST") return handleToken(env, request);

    // Endpoint MCP (POST em / ou /mcp)
    if (path === "/" || path === "/mcp") {
      if (request.method === "GET")
        return new Response("Nervon MCP server. Use POST (MCP Streamable HTTP).", {
          status: 200,
          headers: { ...CORS, "content-type": "text/plain" },
        });
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

      // Token: aceita nvn_ direto (Claude Code) ou access_token do OAuth (= nvn_).
      const auth = request.headers.get("Authorization") ?? "";
      const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
      if (!token) {
        // Dispara o fluxo OAuth no cliente.
        return new Response(JSON.stringify(jsonRpcError(null, -32001, "Não autorizado.")), {
          status: 401,
          headers: {
            ...CORS,
            "content-type": "application/json",
            "WWW-Authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
          },
        });
      }
      const tokenHash = await sha256Hex(token);

      let body: any;
      try {
        body = await request.json();
      } catch {
        return Response.json(jsonRpcError(null, -32700, "JSON inválido."), { headers: CORS });
      }

      if (Array.isArray(body)) {
        const responses = (await Promise.all(body.map((m) => handleRpc(env, tokenHash, m)))).filter(Boolean);
        return Response.json(responses, { headers: CORS });
      }
      const response = await handleRpc(env, tokenHash, body);
      if (response === null) return new Response(null, { status: 202, headers: CORS });
      return Response.json(response, { headers: CORS });
    }

    return new Response("Not Found", { status: 404, headers: CORS });
  },
};
