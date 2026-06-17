/**
 * Servidor MCP do Nervon (TESTE LOCAL).
 *
 * Expõe ferramentas do CRM para um agente Claude externo (Claude Code, Claude
 * Desktop, etc.). Por enquanto: uma ferramenta `criar_lead` que escreve de
 * verdade no Supabase do Nervon.
 *
 * Transporte: stdio (o cliente Claude inicia este processo e fala por stdin/out).
 *
 * IMPORTANTE — segurança:
 *   - Usa a SERVICE ROLE KEY do Supabase (bypassa RLS), então roda SÓ no servidor.
 *   - O `empresa_id` é fixo via env (NERVON_EMPRESA_ID) só para o teste. Na versão
 *     real, viria de um token de acesso que identifica a produtora.
 *   - Nunca commitar o .env com a service role key.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const SUPABASE_URL = process.env.SUPABASE_URL ?? "https://smsqhbbbyjacatxvihks.supabase.co";
const ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "sb_publishable_Kcsq5BKG5RWrv7S9RuoD1w_0b6MS6CU";

// Modo do teste: token de usuário (anon key + Bearer). O RLS resolve a empresa
// pelo auth.uid() do token — sem service role key e sem empresa_id fixo.
const USER_TOKEN = process.env.SUPABASE_USER_TOKEN;
// Modo produção/admin alternativo: service role + empresa_id fixo.
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMPRESA_ID_ENV = process.env.NERVON_EMPRESA_ID;

if (!USER_TOKEN && !SERVICE_ROLE_KEY) {
  console.error("Defina SUPABASE_USER_TOKEN (token de usuário) ou SUPABASE_SERVICE_ROLE_KEY no .env.");
  process.exit(1);
}

const supabase = USER_TOKEN
  ? createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${USER_TOKEN}` } },
    })
  : createClient(SUPABASE_URL, SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

// Resolve a empresa: no modo token, via minha_empresa_id() (RLS); senão, env.
async function resolverEmpresaId(): Promise<string | null> {
  if (EMPRESA_ID_ENV) return EMPRESA_ID_ENV;
  const { data } = await supabase.rpc("minha_empresa_id");
  return (data as string) ?? null;
}

const server = new McpServer({ name: "nervon", version: "0.1.0" });

server.tool(
  "criar_lead",
  "Cria uma nova oportunidade (lead) no CRM Nervon do usuário. Use quando o agente " +
    "encontrar um possível cliente para a produtora de audiovisual.",
  {
    empresa: z.string().describe("Nome da empresa/cliente do lead (ex: 'Padaria Pão Quente')"),
    contato: z.string().describe("Nome da pessoa de contato (ex: 'João Silva')"),
    email: z.string().optional().describe("E-mail do contato"),
    telefone: z.string().optional().describe("Telefone do contato"),
    valor: z.number().optional().describe("Valor estimado da oportunidade em reais"),
    origem: z.string().optional().describe("Origem do lead (ex: 'Instagram', 'Indicação')"),
    temperatura: z.enum(["frio", "morno", "quente"]).optional().describe("Temperatura do lead"),
    segmento: z.string().optional().describe("Segmento do cliente (ex: 'Gastronomia')"),
    cidade: z.string().optional().describe("Cidade do cliente"),
  },
  async (args) => {
    const empresaId = await resolverEmpresaId();
    if (!empresaId) return err("Não foi possível resolver a empresa (token inválido ou usuário sem empresa).");

    // 1. cliente
    const { data: cliente, error: e1 } = await supabase
      .from("clientes_comercial")
      .insert({
        empresa_id: empresaId,
        nome: args.empresa,
        segmento: args.segmento || "Não informado",
        cidade: args.cidade || "Não informado",
      })
      .select("id")
      .single();
    if (e1 || !cliente) return err(`Erro ao criar cliente: ${e1?.message ?? "sem dados"}`);

    // 2. contato
    const { data: contato, error: e2 } = await supabase
      .from("contatos_comercial")
      .insert({
        empresa_id: empresaId,
        cliente_id: cliente.id,
        nome: args.contato,
        cargo: "—",
        email: args.email || "—",
        telefone: args.telefone || "—",
        principal: true,
      })
      .select("id")
      .single();
    if (e2 || !contato) return err(`Erro ao criar contato: ${e2?.message ?? "sem dados"}`);

    // 3. lead
    const { data: lead, error: e3 } = await supabase
      .from("leads")
      .insert({
        empresa_id: empresaId,
        cliente_id: cliente.id,
        contato_id: contato.id,
        etapa: "novo",
        valor: args.valor ?? 0,
        responsavel: "Agente IA",
        temperatura: args.temperatura ?? "morno",
        origem: args.origem || "Agente IA",
      })
      .select("id")
      .single();
    if (e3 || !lead) return err(`Erro ao criar lead: ${e3?.message ?? "sem dados"}`);

    // 4. timeline
    await supabase.from("timeline_lead").insert({
      empresa_id: empresaId,
      lead_id: lead.id,
      tipo: "criado",
      titulo: "Lead criado pelo agente IA",
      descricao: args.empresa,
      quando: new Date().toISOString(),
      autor: "Agente IA",
    });

    return {
      content: [
        {
          type: "text",
          text: `Lead criado com sucesso no Nervon: "${args.empresa}" (contato: ${args.contato}). ID: ${lead.id}`,
        },
      ],
    };
  },
);

function err(message: string) {
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Nervon MCP server rodando (stdio).");
