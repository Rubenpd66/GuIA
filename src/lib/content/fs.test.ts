import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validExercises, validLessons } from "../../../tests/fixtures/content";
import { readContentDir } from "./fs";
import { validateContentSet } from "./validate";

let dir: string;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "sello-content-"));
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("readContentDir", () => {
  it("reads nested JSON files, including Windows-saved ones with BOM and CRLF", async () => {
    await mkdir(join(dir, "exercises"));
    const windowsJson =
      "﻿" +
      JSON.stringify(
        { kind: "exercises", items: Object.values(validExercises) },
        null,
        2,
      ).replace(/\n/g, "\r\n");
    await writeFile(join(dir, "exercises", "all.json"), windowsJson, "utf8");
    await writeFile(
      join(dir, "grammar.json"),
      JSON.stringify({
        kind: "grammar-lessons",
        items: [validLessons.grammar],
      }),
    );
    await writeFile(
      join(dir, "can-do.json"),
      JSON.stringify({ kind: "can-do", items: [validLessons.canDo] }),
    );
    await writeFile(join(dir, "README.md"), "# Not content");

    const sources = await readContentDir(dir);
    expect(sources.map((s) => s.path)).toEqual([
      "can-do.json",
      "exercises/all.json",
      "grammar.json",
    ]);
    expect(validateContentSet(sources).errors).toEqual([]);
  });

  it("returns nothing for a missing folder", async () => {
    expect(await readContentDir(join(dir, "missing"))).toEqual([]);
  });
});
