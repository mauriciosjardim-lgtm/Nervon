/**
 * Nervon MCP — servidor remoto (Cloudflare Worker)
 * ------------------------------------------------------------------
 * Expõe as ferramentas do CRM Nervon para o agente Claude de cada
 * produtora, via MCP "Streamable HTTP" (JSON-RPC sobre HTTP POST).
 *
 * Autenticação: o cliente manda `Authorization: Bearer nvn_<token>`.
 * O Worker calcula o SHA-256 do token e chama funções SECURITY DEFINER
 * no Postgres (mcp_criar_lead, mcp_listar_leads, mcp_mover_etapa) que
 * validam o token, resolvem a empresa e executam tudo amarrado a ela.
 *
 * Sem service role key. A chave usada (anon/publishable) é pública.
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

const PROTOCOL_VERSION = "2025-06-18";
const SERVER_INFO = { name: "nervon", version: "1.0.0" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, mcp-session-id, mcp-protocol-version",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

// ─── Definição das ferramentas (JSON Schema p/ o cliente) ───────────────────
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
    description:
      "Lista os leads do funil comercial da produtora no Nervon. Opcionalmente filtra por etapa.",
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

// ─── Helpers ────────────────────────────────────────────────────────────────
async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function callRpc(env: Env, fn: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase RPC ${fn} falhou (${res.status}): ${await res.text()}`);
  return res.json();
}

function jsonRpcResult(id: unknown, result: unknown) {
  return { jsonrpc: "2.0", id, result };
}
function jsonRpcError(id: unknown, code: number, message: string) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}
function toolText(text: string, isError = false) {
  return { content: [{ type: "text", text }], isError };
}

// ─── Execução das ferramentas ─────────────────────────────────────────────────
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
      const r: any = await callRpc(env, "mcp_listar_leads", {
        p_token_hash: tokenHash,
        p_etapa: args.etapa ?? null,
      });
      if (!r?.ok) return toolText(r?.erro ?? "Erro ao listar leads.", true);
      const leads = r.leads ?? [];
      if (leads.length === 0) return toolText("Nenhum lead encontrado.");
      return toolText(JSON.stringify(leads, null, 2));
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

// ─── Handler MCP (JSON-RPC) ───────────────────────────────────────────────────
async function handleRpc(env: Env, tokenHash: string | null, msg: any): Promise<unknown | null> {
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
      return null; // notificação: sem resposta

    case "ping":
      return jsonRpcResult(id, {});

    case "tools/list":
      return jsonRpcResult(id, { tools: TOOLS });

    case "tools/call": {
      if (!tokenHash) return jsonRpcError(id, -32001, "Token ausente. Configure o Authorization: Bearer nvn_...");
      const toolName = params?.name;
      const args = params?.arguments ?? {};
      try {
        const result = await runTool(env, tokenHash, toolName, args);
        return jsonRpcResult(id, result);
      } catch (e: any) {
        return jsonRpcResult(id, toolText(`Erro: ${e?.message ?? e}`, true));
      }
    }

    default:
      return jsonRpcError(id, -32601, `Método não suportado: ${method}`);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });

    if (request.method === "GET") {
      // Sem stream servidor→cliente nesta versão stateless.
      return new Response("Nervon MCP server. Use POST (MCP Streamable HTTP).", {
        status: 405,
        headers: { ...CORS, "content-type": "text/plain" },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: CORS });
    }

    // Extrai o token "nvn_..." do header Authorization e já calcula o hash.
    const auth = request.headers.get("Authorization") ?? "";
    const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : null;
    const tokenHash = token ? await sha256Hex(token) : null;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return Response.json(jsonRpcError(null, -32700, "JSON inválido."), { headers: CORS });
    }

    // Pode vir um único objeto ou um array (batch).
    if (Array.isArray(body)) {
      const responses = (await Promise.all(body.map((m) => handleRpc(env, tokenHash, m)))).filter(Boolean);
      return Response.json(responses, { headers: CORS });
    }

    const response = await handleRpc(env, tokenHash, body);
    if (response === null) {
      // Notificação: 202 sem corpo.
      return new Response(null, { status: 202, headers: CORS });
    }
    return Response.json(response, { headers: CORS });
  },
};
