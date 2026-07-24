import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const schema = readFileSync("supabase/schema.sql", "utf8").toLowerCase();
const pendingOrdersBase = readFileSync(
  "supabase/migrations/20260724180000_pending_orders_base.sql",
  "utf8",
).toLowerCase();
const claim = readFileSync(
  "supabase/migrations/20260724183000_claim_atomico_pending_orders.sql",
  "utf8",
).toLowerCase();

describe("database tenant and RBAC contracts", () => {
  test("the payment-order base precedes the atomic claim migration", () => {
    expect(pendingOrdersBase).toContain("create table if not exists public.pending_orders");
    expect(pendingOrdersBase).toContain("enable row level security");
    expect(pendingOrdersBase).toContain("to service_role");
    expect(pendingOrdersBase).toContain("senha = null");
  });

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

  test("the order claim RPC is service-role only", () => {
    expect(claim).toContain("from public");
    expect(claim).toContain("from anon");
    expect(claim).toContain("from authenticated");
    expect(claim).toContain("to service_role");
  });
});
