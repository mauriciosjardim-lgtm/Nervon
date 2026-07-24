import { describe, expect, test } from "bun:test";
import { comprovantePath } from "./comprovantes";

describe("comprovantePath", () => {
  test("preserves a private tenant path", () => {
    expect(comprovantePath("empresa-a/arquivo.pdf")).toBe("empresa-a/arquivo.pdf");
  });

  test("migrates a legacy public URL when it is opened", () => {
    expect(
      comprovantePath(
        "https://project.supabase.co/storage/v1/object/public/comprovantes/empresa-a/nota%20fiscal.pdf?x=1",
      ),
    ).toBe("empresa-a/nota fiscal.pdf");
  });

  test("rejects values without a tenant folder", () => {
    expect(() => comprovantePath("arquivo.pdf")).toThrow();
    expect(() => comprovantePath("../outra-empresa/arquivo.pdf")).toThrow();
  });
});
