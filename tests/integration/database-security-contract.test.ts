import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const schema = readFileSync("supabase/schema.sql", "utf8").toLowerCase();
const mcp = readFileSync(
  "supabase/migrations/20260722150000_mcp_v10_acessos_migracoes.sql",
  "utf8",
).toLowerCase();
const claim = readFileSync(
  "supabase/migrations/20260724183000_claim_atomico_pending_orders.sql",
  "utf8",
).toLowerCase();

describe("database tenant and RBAC contracts", () => {
  test("critical tenant tables enable RLS and scope policies by company", () => {
    for (const table of ["usuarios", "clientes", "projetos", "tarefas", "financeiro"]) {
      expect(schema).toMatch(new RegExp(`alter table ${table}\\s+enable row level security`));
      expect(schema).toMatch(
        new RegExp(
          `create policy ["']?mesma_empresa["']? on\\s+${table}[\\s\\S]{0,180}empresa_id = minha_empresa_id\\(\\)`,
        ),
      );
    }
  });

  test("MCP definer functions reject invalid tokens and missing module permission", () => {
    expect(mcp).toContain("where token_hash=p_token_hash and revogado=false");
    expect(mcp).toContain("if not ('projetos'=any(v_permissoes))");
    expect(mcp).toContain("if not ('financeiro'=any(v_permissoes))");
    expect(mcp).toContain("insert into public.projetos(empresa_id");
    expect(mcp).toContain("values(v_empresa");
  });

  test("the order claim RPC is service-role only", () => {
    expect(claim).toContain("from public");
    expect(claim).toContain("from anon");
    expect(claim).toContain("from authenticated");
    expect(claim).toContain("to service_role");
  });
});
