import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SITE } from "@/config/site";

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (value && typeof value === "object")
    Object.values(value).forEach((v) => strings(v, out));
  return out;
}

describe("brand", () => {
  it("is GuIA", () => {
    expect(SITE.name).toBe("GuIA");
  });

  it.each(["es", "en"])(
    "%s messages carry no old name or stamp wording",
    (l) => {
      const json = JSON.parse(
        readFileSync(
          new URL(`../../messages/${l}.json`, import.meta.url),
          "utf8",
        ),
      );
      const hits = strings(json).filter((s) =>
        /\bsellos?\b|\bstamps?\b/i.test(s),
      );
      expect(hits).toEqual([]);
    },
  );
});
