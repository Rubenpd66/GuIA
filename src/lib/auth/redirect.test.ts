import { describe, expect, it } from "vitest";
import { safeNext } from "./redirect";

describe("safeNext", () => {
  it("keeps paths on this site", () => {
    expect(safeNext("/es/cuenta", "/es")).toBe("/es/cuenta");
    expect(safeNext("/en/account?tab=sync", "/en")).toBe(
      "/en/account?tab=sync",
    );
  });

  it("refuses anything that could leave the site", () => {
    for (const next of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "\\\\evil.test",
      "javascript:alert(1)",
      "/es\n/x",
      "",
      null,
      undefined,
    ])
      expect(safeNext(next, "/es")).toBe("/es");
  });
});
