import { describe, expect, test } from "bun:test";

describe("integration test harness", () => {
  test("runs without external credentials", () => {
    expect(typeof Request).toBe("function");
  });
});
