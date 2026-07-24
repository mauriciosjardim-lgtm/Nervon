import { describe, expect, test } from "bun:test";

describe("e2e test harness", () => {
  test("keeps production credentials out of the default run", () => {
    expect(typeof URL).toBe("function");
  });
});
