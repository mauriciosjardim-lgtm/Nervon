/**
 * MakersHub MCP — servidor remoto + OAuth (Cloudflare Worker)
 * ============================================================================
 * Expõe as ferramentas do CRM MakersHub para o Claude de cada produtora.
 *
 * Dois jeitos de conectar:
 *  1) Token fixo (Claude Code):  Authorization: Bearer nvn_...
 *  2) OAuth (Claude Desktop):    o cliente clica "adicionar conector", faz
 *     login no MakersHub e autoriza — sem copiar token nenhum.
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
      "Cria uma nova oportunidade (lead) no CRM MakersHub da produtora. Use ao encontrar um possível cliente para a produtora de audiovisual.",
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
    description: "Lista os leads do funil comercial da produtora no MakersHub. Opcionalmente filtra por etapa.",
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
    description: "Move um lead para outra etapa do funil comercial no MakersHub.",
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

  // ── Financeiro ──
  {
    name: "criar_lancamento",
    description: "Lança uma receita ou despesa no financeiro do MakersHub. Use para registrar entradas e saídas de dinheiro da produtora.",
    inputSchema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["receita", "despesa"], description: "Tipo do lançamento" },
        categoria: { type: "string", description: "Categoria (ex: 'Edição', 'Equipamento', 'Salários')" },
        descricao: { type: "string", description: "Descrição do lançamento" },
        valor: { type: "number", description: "Valor em reais" },
        vencimento: { type: "string", description: "Data de vencimento (YYYY-MM-DD)" },
        cliente: { type: "string", description: "Cliente associado (opcional)" },
        forma_pagamento: { type: "string", description: "Forma de pagamento (ex: 'PIX', 'Boleto') (opcional)" },
        observacoes: { type: "string", description: "Observações (opcional)" },
        pago: { type: "boolean", description: "Se já foi pago/recebido (default false)" },
      },
      required: ["tipo", "descricao", "valor", "vencimento"],
    },
  },
  {
    name: "listar_lancamentos",
    description: "Lista os lançamentos financeiros do MakersHub. Filtra opcionalmente por tipo (receita/despesa) e status.",
    inputSchema: {
      type: "object",
      properties: {
        tipo: { type: "string", enum: ["receita", "despesa"], description: "Filtrar por tipo (opcional)" },
        status: { type: "string", enum: ["previsto", "recebido", "pago", "atrasado"], description: "Filtrar por status (opcional)" },
      },
    },
  },
  {
    name: "marcar_pago",
    description: "Marca um lançamento financeiro como pago (despesa) ou recebido (receita), na data de hoje.",
    inputSchema: {
      type: "object",
      properties: { lancamento_id: { type: "string", description: "ID do lançamento (obtido via listar_lancamentos)" } },
      required: ["lancamento_id"],
    },
  },
  {
    name: "resumo_financeiro",
    description: "Retorna um resumo financeiro da produtora: total a receber, a pagar, atrasados e saldo do mês.",
    inputSchema: { type: "object", properties: {} },
  },

  // ── Projetos ──
  {
    name: "criar_projeto",
    description: "Cria um novo projeto (produção audiovisual) no MakersHub.",
    inputSchema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome do projeto" },
        cliente: { type: "string", description: "Cliente do projeto" },
        descricao: { type: "string", description: "Descrição (opcional)" },
        valor: { type: "number", description: "Valor do projeto em reais (opcional)" },
        data_inicio: { type: "string", description: "Data de início (YYYY-MM-DD) (opcional)" },
        data_entrega: { type: "string", description: "Data de entrega (YYYY-MM-DD) (opcional)" },
      },
      required: ["nome", "cliente"],
    },
  },
  {
    name: "listar_projetos",
    description: "Lista os projetos da produtora no MakersHub (fase, progresso, valor, entrega).",
    inputSchema: { type: "object", properties: {} },
  },

  // ── Follow-ups ──
  {
    name: "criar_followup",
    description: "Cria uma tarefa de follow-up para um lead do funil comercial no MakersHub.",
    inputSchema: {
      type: "object",
      properties: {
        lead_id: { type: "string", description: "ID do lead (obtido via listar_leads)" },
        titulo: { type: "string", description: "O que fazer (ex: 'Ligar para confirmar proposta')" },
        prazo: { type: "string", description: "Prazo (YYYY-MM-DD)" },
        responsavel: { type: "string", description: "Responsável (opcional)" },
      },
      required: ["lead_id", "titulo", "prazo"],
    },
  },

  // ── Agenda ──
  {
    name: "criar_evento",
    description: "Cria um evento na agenda do MakersHub (reunião, gravação, entrega, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        titulo: { type: "string", description: "Título do evento" },
        inicio: { type: "string", description: "Início (ISO 8601, ex: 2026-06-20T14:00:00-03:00)" },
        fim: { type: "string", description: "Fim (ISO 8601)" },
        descricao: { type: "string", description: "Descrição (opcional)" },
        tipo: { type: "string", enum: ["reuniao", "gravacao", "entrega", "tarefa", "outro"], description: "Tipo do evento (opcional)" },
        local: { type: "string", description: "Local (opcional)" },
      },
      required: ["titulo", "inicio", "fim"],
    },
  },
  {
    name: "listar_eventos",
    description: "Lista eventos da agenda do MakersHub. Filtra opcionalmente por período (de/até).",
    inputSchema: {
      type: "object",
      properties: {
        de: { type: "string", description: "Início do período (ISO 8601) (opcional)" },
        ate: { type: "string", description: "Fim do período (ISO 8601) (opcional)" },
      },
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

/** Insere um token nvn_ (hash) na empresa do usuário, via RLS. Devolve null se ok, string de erro se falhou. */
async function inserirTokenDaEmpresa(env: Env, userJwt: string, empresaId: string, tokenHash: string): Promise<string | null> {
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
  if (res.ok) return null;
  const txt = await res.text().catch(() => "(sem body)");
  return `Supabase ${res.status}: ${txt}`;
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
      return toolText(`Lead criado no MakersHub: "${r.cliente}" (contato: ${r.contato}). ID: ${r.lead_id}`);
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

    // ── Financeiro ──
    case "criar_lancamento": {
      const r: any = await callRpc(env, "mcp_criar_lancamento", {
        p_token_hash: tokenHash,
        p_tipo: args.tipo,
        p_categoria: args.categoria ?? "Geral",
        p_descricao: args.descricao,
        p_valor: args.valor ?? 0,
        p_vencimento: args.vencimento,
        p_cliente: args.cliente ?? null,
        p_forma_pagamento: args.forma_pagamento ?? null,
        p_observacoes: args.observacoes ?? null,
        p_pago: args.pago ?? false,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao criar lançamento.", true);
      return toolText(`Lançamento criado (${r.tipo}, R$ ${r.valor}, status: ${r.status}). ID: ${r.lancamento_id}`);
    }
    case "listar_lancamentos": {
      const r: any = await callRpc(env, "mcp_listar_lancamentos", { p_token_hash: tokenHash, p_tipo: args.tipo ?? null, p_status: args.status ?? null });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao listar lançamentos.", true);
      const ls = r.lancamentos ?? [];
      return toolText(ls.length === 0 ? "Nenhum lançamento encontrado." : JSON.stringify(ls, null, 2));
    }
    case "marcar_pago": {
      const r: any = await callRpc(env, "mcp_marcar_pago", { p_token_hash: tokenHash, p_lancamento_id: args.lancamento_id });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao marcar pago.", true);
      return toolText(`Lançamento ${r.lancamento_id} marcado como "${r.status}".`);
    }
    case "resumo_financeiro": {
      const r: any = await callRpc(env, "mcp_resumo_financeiro", { p_token_hash: tokenHash });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao gerar resumo.", true);
      return toolText(JSON.stringify({ a_receber: r.a_receber, a_pagar: r.a_pagar, atrasados: r.atrasados, recebido_no_mes: r.recebido_no_mes, pago_no_mes: r.pago_no_mes, saldo_do_mes: r.saldo_do_mes }, null, 2));
    }

    // ── Projetos ──
    case "criar_projeto": {
      const r: any = await callRpc(env, "mcp_criar_projeto", {
        p_token_hash: tokenHash,
        p_nome: args.nome,
        p_cliente: args.cliente,
        p_descricao: args.descricao ?? null,
        p_valor: args.valor ?? 0,
        p_data_inicio: args.data_inicio ?? null,
        p_data_entrega: args.data_entrega ?? null,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao criar projeto.", true);
      return toolText(`Projeto "${r.nome}" criado. ID: ${r.projeto_id}`);
    }
    case "listar_projetos": {
      const r: any = await callRpc(env, "mcp_listar_projetos", { p_token_hash: tokenHash });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao listar projetos.", true);
      const ps = r.projetos ?? [];
      return toolText(ps.length === 0 ? "Nenhum projeto encontrado." : JSON.stringify(ps, null, 2));
    }

    // ── Follow-ups ──
    case "criar_followup": {
      const r: any = await callRpc(env, "mcp_criar_followup", {
        p_token_hash: tokenHash,
        p_lead_id: args.lead_id,
        p_titulo: args.titulo,
        p_prazo: args.prazo,
        p_responsavel: args.responsavel ?? "Agente IA",
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao criar follow-up.", true);
      return toolText(`Follow-up criado: "${r.titulo}" (prazo ${r.prazo}). ID: ${r.followup_id}`);
    }

    // ── Agenda ──
    case "criar_evento": {
      const r: any = await callRpc(env, "mcp_criar_evento", {
        p_token_hash: tokenHash,
        p_titulo: args.titulo,
        p_inicio: args.inicio,
        p_fim: args.fim,
        p_descricao: args.descricao ?? null,
        p_tipo: args.tipo ?? "reuniao",
        p_local: args.local ?? null,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao criar evento.", true);
      return toolText(`Evento "${r.titulo}" criado para ${r.inicio}. ID: ${r.evento_id}`);
    }
    case "listar_eventos": {
      const r: any = await callRpc(env, "mcp_listar_eventos", { p_token_hash: tokenHash, p_de: args.de ?? null, p_ate: args.ate ?? null });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao listar eventos.", true);
      const es = r.eventos ?? [];
      return toolText(es.length === 0 ? "Nenhum evento encontrado." : JSON.stringify(es, null, 2));
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
    // O claude.ai usa o resource COM barra final ("https://.../") e valida que
    // este campo bate exatamente (RFC 8707/9728). Por isso devolvemos base + "/".
    resource: `${base}/`,
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
    grant_types_supported: ["authorization_code", "refresh_token"],
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

// ─── OAuth: validação de redirect_uri ───────────────────────────────────────
// Clientes públicos (Claude) podem não fazer registro dinâmico ou usar um
// client_id cacheado. A segurança vem do PKCE + redirect_uri confiável: só
// aceitamos callbacks dos domínios do Claude/Anthropic (ou localhost no app).
const KNOWN_REDIRECT_HOSTS = [
  // Claude / Anthropic
  "claude.ai", "claudeusercontent.com", "anthropic.com", "claude.com",
  // ChatGPT / OpenAI
  "chatgpt.com", "openai.com", "oaiusercontent.com",
];
function redirectAllowed(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return true;
    return u.protocol === "https:" && KNOWN_REDIRECT_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h));
  } catch {
    return false;
  }
}
/** Valida o redirect_uri: contra o client registrado (se houver) ou a allowlist. */
async function redirectUriOk(env: Env, clientId: string, redirectUri: string): Promise<boolean> {
  if (!redirectUri) return false;
  const client = await verifyToken<any>(env.OAUTH_SIGNING_KEY, clientId ?? "");
  if (client && client.t === "client" && Array.isArray(client.ru)) return client.ru.includes(redirectUri);
  return redirectAllowed(redirectUri);
}

// ─── OAuth: tela de login/consentimento ──────────────────────────────────────
function loginPage(params: Record<string, string>, erro?: string): Response {
  const hidden = ["client_id", "redirect_uri", "code_challenge", "code_challenge_method", "state", "scope", "resource"]
    .map((k) => `<input type="hidden" name="${k}" value="${escapeHtml(params[k] ?? "")}">`)
    .join("\n");
  const html = `<!doctype html><html lang="pt-BR"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Conectar ao MakersHub</title>
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
    <h1>Conectar ao MakersHub</h1>
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
  if (!(await redirectUriOk(env, p.client_id, p.redirect_uri)))
    return badAuthorize("redirect_uri não permitido: " + (p.redirect_uri ?? "(vazio)"));
  return loginPage(p);
}
function badAuthorize(msg: string): Response {
  return new Response(`Erro de autorização: ${msg}`, { status: 400, headers: { ...CORS, "content-type": "text/plain; charset=utf-8" } });
}

// ─── OAuth: POST /authorize (faz login, emite código) ────────────────────────
async function handleAuthorizePost(env: Env, request: Request): Promise<Response> {
  const form = new URLSearchParams(await request.text());
  const p = Object.fromEntries(form.entries());

  if (!(await redirectUriOk(env, p.client_id, p.redirect_uri)))
    return badAuthorize("redirect_uri não permitido: " + (p.redirect_uri ?? "(vazio)"));

  // 1. login no Supabase
  const jwt = await supabasePasswordLogin(env, p.email ?? "", p.password ?? "");
  if (!jwt) return loginPage(p, "E-mail ou senha incorretos.");

  // 2. resolve a empresa
  let empresaId: string | null = null;
  try {
    empresaId = (await callRpc(env, "minha_empresa_id", {}, jwt)) as string;
  } catch (e: any) {
  }
  if (!empresaId) return loginPage(p, "Sua conta ainda não tem uma produtora. Faça o onboarding no app primeiro.");

  // 3. gera o token nvn_ e salva o hash na empresa (via RLS, com o JWT do usuário)
  const nvn = genNvnToken();
  const erroInsert = await inserirTokenDaEmpresa(env, jwt, empresaId, await sha256Hex(nvn));
  if (erroInsert) return loginPage(p, `Não foi possível criar o acesso: ${erroInsert}`);

  // 4. emite o código de autorização (assinado, com TTL) e redireciona
  // Carregamos o scope EXATO que o cliente pediu p/ ecoar de volta no /token
  // (OAuth 2.1: o scope concedido deve ser subconjunto do solicitado).
  const code = await signToken(env.OAUTH_SIGNING_KEY, {
    t: "code",
    nvn,
    cc: p.code_challenge,
    ru: p.redirect_uri,
    sc: p.scope ?? "",
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


  let nvn: string;
  let sc = "";

  if (p.grant_type === "refresh_token") {
    // Renovação: o refresh_token é um token assinado que carrega o nvn_.
    const rt = await verifyToken<any>(env.OAUTH_SIGNING_KEY, p.refresh_token ?? "");
    if (!rt || rt.t !== "refresh") { return Response.json({ error: "invalid_grant", error_description: "refresh_token inválido" }, { status: 400, headers: CORS }); }
    nvn = rt.nvn;
    sc = rt.sc ?? "";
  } else if (p.grant_type === "authorization_code") {
    const code = await verifyToken<any>(env.OAUTH_SIGNING_KEY, p.code ?? "");
    if (!code || code.t !== "code") { return Response.json({ error: "invalid_grant", error_description: "código inválido" }, { status: 400, headers: CORS }); }
    if (Date.now() > code.exp) { return Response.json({ error: "invalid_grant", error_description: "código expirado" }, { status: 400, headers: CORS }); }
    if (p.redirect_uri && p.redirect_uri !== code.ru) { return Response.json({ error: "invalid_grant", error_description: "redirect_uri não confere" }, { status: 400, headers: CORS }); }
    // PKCE: base64url(sha256(code_verifier)) deve bater com o code_challenge
    const expected = b64urlFromBytes(await sha256Bytes(p.code_verifier ?? ""));
    if (expected !== code.cc) { return Response.json({ error: "invalid_grant", error_description: "PKCE inválido" }, { status: 400, headers: CORS }); }
    nvn = code.nvn;
    sc = code.sc ?? "";
  } else {
    return Response.json({ error: "unsupported_grant_type" }, { status: 400, headers: CORS });
  }

  // O access_token É o token nvn_ (o endpoint MCP já sabe validá-lo).
  // Emitimos também um refresh_token (assinado) — clientes como o Claude esperam
  // poder renovar quando há expires_in. RFC 6749 §5.1, headers obrigatórios.
  const refreshToken = await signToken(env.OAUTH_SIGNING_KEY, { t: "refresh", nvn, sc, iat: Date.now() });
  const tokenResp: Record<string, unknown> = {
    access_token: nvn,
    token_type: "Bearer",
    expires_in: 31536000,
    refresh_token: refreshToken,
  };
  if (sc) tokenResp.scope = sc; // só ecoa se foi solicitado
  return new Response(JSON.stringify(tokenResp), {
    status: 200,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    },
  });
}

// ─── Entrada ──────────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const base = url.origin;
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      const reqHeaders = request.headers.get("Access-Control-Request-Headers");
      // Espelha os headers solicitados p/ nunca bloquear o preflight.
      return new Response(null, {
        headers: { ...CORS, ...(reqHeaders ? { "Access-Control-Allow-Headers": reqHeaders } : {}), "Access-Control-Max-Age": "86400" },
      });
    }

    // Descoberta OAuth — no-store p/ o claude/edge NUNCA servir metadata velha
    const noStore = { ...CORS, "Cache-Control": "no-store", "Content-Type": "application/json; charset=utf-8" };
    if (path === "/.well-known/oauth-protected-resource")
      return new Response(JSON.stringify(protectedResourceMetadata(base)), { headers: noStore });
    if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration")
      return new Response(JSON.stringify(authServerMetadata(base)), { headers: noStore });

    // Endpoints OAuth
    if (path === "/register" && request.method === "POST") return handleRegister(env, request);
    if (path === "/authorize" && request.method === "GET") return handleAuthorizeGet(env, url);
    if (path === "/authorize" && request.method === "POST") return handleAuthorizePost(env, request);
    if (path === "/token" && request.method === "POST") return handleToken(env, request);

    // Endpoint MCP (/ , /mcp ou /sse)
    if (path === "/" || path === "/mcp" || path === "/sse") {
      // Token: aceita nvn_ direto (Claude Code) ou access_token do OAuth (= nvn_).
      const auth = request.headers.get("Authorization") ?? "";
      const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;

      // Sem token → 401 com WWW-Authenticate em QUALQUER método (GET/POST).
      // É isso que faz o Claude descobrir o OAuth e abrir a tela de login.
      if (!token) {
        return new Response(JSON.stringify(jsonRpcError(null, -32001, "Não autorizado.")), {
          status: 401,
          headers: {
            ...CORS,
            "content-type": "application/json",
            "WWW-Authenticate": `Bearer resource_metadata="${base}/.well-known/oauth-protected-resource"`,
          },
        });
      }

      // Com token, mas GET: não temos stream servidor→cliente (modo stateless).
      // 405 faz o cliente usar só POST (Streamable HTTP), que é o que suportamos.
      if (request.method === "GET")
        return new Response(JSON.stringify(jsonRpcError(null, -32000, "Use POST.")), {
          status: 405,
          headers: { ...CORS, "content-type": "application/json", Allow: "POST" },
        });
      if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: CORS });

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
