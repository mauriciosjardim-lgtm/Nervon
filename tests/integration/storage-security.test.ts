import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hardeningPath =
  "supabase/migrations/20260724190000_comprovantes_storage_tenant_isolation.sql";

test("comprovantes storage is private and tenant scoped", () => {
  const sql = readFileSync(hardeningPath, "utf8").toLowerCase();

  expect(sql).toContain("update storage.buckets");
  expect(sql).toContain("public = false");
  expect(sql).toContain("storage.foldername(name)");
  expect(sql).toContain("auth.uid()");
  expect(sql).toContain("for select");
  expect(sql).toContain("for insert");
  expect(sql).toContain("for update");
  expect(sql).toContain("for delete");
});
