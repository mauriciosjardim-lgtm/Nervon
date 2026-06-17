# Nervon MCP — teste local

Servidor MCP que expõe ferramentas do CRM Nervon para um agente Claude externo.
Prova de conceito: a ferramenta `criar_lead` escreve de verdade no Supabase.

## 1. Configurar

```bash
cd nervon-mcp
cp .env.example .env
# Edite .env e cole a SERVICE ROLE KEY do Supabase
# (Supabase → Project Settings → API → service_role)
bun install
```

## 2. Testar com o MCP Inspector (jeito mais rápido)

```bash
bunx @modelcontextprotocol/inspector bun run server.ts
```

Abre uma UI no navegador. Em "Tools", chama `criar_lead` com:
`{ "empresa": "Padaria Teste", "contato": "João" }`
→ deve responder "Lead criado..." e aparecer no funil em nervon.com.br.

## 3. Testar conectando no Claude Code

```bash
claude mcp add nervon -- bun run /Users/rastro/MAKERShub/nervon-mcp/server.ts
```

Depois, numa sessão do Claude: "cria um lead da Padaria Teste, contato João".

## Como vira produção

Hoje é stdio + service role key + empresa fixa. A versão real:
- Vira um MCP **remoto** (HTTP) hospedado no Cloudflare Workers.
- Autenticação por token/OAuth → identifica a produtora → `empresa_id` dinâmico.
- Cada produtora conecta a URL do Nervon no Claude dela.
