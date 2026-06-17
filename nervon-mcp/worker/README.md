# Nervon MCP — servidor remoto (Cloudflare Worker)

Servidor MCP que cada produtora conecta no próprio Claude para alimentar o CRM
Nervon de forma autônoma (criar leads, listar funil, mover etapas).

## Arquitetura

```
Claude do cliente  ──HTTP/MCP──>  Worker (Cloudflare)  ──RPC──>  Supabase
   Bearer <token>                  calcula SHA-256        funções SECURITY DEFINER
                                   chama RPC com o hash   validam token + escrevem
```

- **Sem service role key.** O Worker só usa a chave anon (pública). Quem valida o
  token e resolve a empresa são as funções `mcp_*` no Postgres (SECURITY DEFINER).
- O banco guarda só o hash SHA-256 do token. O Worker recebe o token, calcula o
  mesmo hash e passa adiante.

### Dois jeitos de conectar

1. **OAuth (Claude Desktop / app)** — o cliente adiciona o conector `mcp.nervon.com.br`,
   faz login no Nervon e autoriza. Nenhum token manual.
   - O Worker é um **servidor OAuth completo** e *stateless*: client_ids e códigos
     de autorização são tokens HMAC assinados (segredo `OAUTH_SIGNING_KEY`), sem
     KV/banco extra. Implementa discovery (`/.well-known/*`), registro dinâmico
     (`/register`), `/authorize` (tela de login → Supabase password grant) e
     `/token` (com PKCE S256).
   - No fim do login geramos um token `nvn_` normal (hash salvo em `mcp_tokens`) e
     ele **vira** o `access_token` do OAuth → o endpoint MCP continua idêntico.

2. **Token fixo (Claude Code / terminal)** — `Authorization: Bearer nvn_...`, gerado
   no app em Configurações → Agente IA (opção "Avançado").

### Segredo necessário

```bash
# chave aleatória p/ assinar os tokens OAuth (uma vez)
head -c 48 /dev/urandom | base64 | tr -d '/+=' | npx wrangler secret put OAUTH_SIGNING_KEY
```

## Deploy (uma vez)

Pré-requisito: rodar `../sql/mcp.sql` no SQL Editor do Supabase.

```bash
cd nervon-mcp/worker
npm install        # ou bun install
npx wrangler login # abre o navegador, autoriza a conta Cloudflare
npx wrangler deploy
```

O deploy imprime a URL pública, algo como:
`https://nervon-mcp.<sua-conta>.workers.dev`

Copie essa URL e cole em `src/routes/configuracoes.tsx` na constante `MCP_URL`,
depois faça commit/push (o app reaplica no comando que o usuário copia).

## Testar

Inspector MCP apontando para a URL do deploy:

```bash
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP
# URL: https://nervon-mcp.<conta>.workers.dev
# Header: Authorization: Bearer nvn_<token gerado no app>
```

Ou direto no Claude do cliente (o comando pronto sai no app):

```bash
claude mcp add --transport http nervon https://nervon-mcp.<conta>.workers.dev \
  --header "Authorization: Bearer nvn_xxx"
```

## Ferramentas expostas

| Tool | O que faz |
|------|-----------|
| `criar_lead`   | Cria cliente + contato + lead + timeline no funil |
| `listar_leads` | Lista o funil (filtro opcional por etapa) |
| `mover_etapa`  | Move um lead para outra etapa |

Para adicionar uma ferramenta: crie a função `mcp_*` em `../sql/mcp.sql`, registre
em `TOOLS` e trate no `runTool` em `src/index.ts`.
