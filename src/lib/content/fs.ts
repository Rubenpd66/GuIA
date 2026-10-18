import { readFile, readdir } from "node:fs/promises";
import { join, sep } from "node:path";
import type { ContentSource } from "./validate";

/** Reads every JSON file under `dir`, recursively, with paths relative to `dir` and `/` separators. */
export async function readContentDir(dir: string): Promise<ContentSource[]> {
  let entries: string[];
  try {
    entries = await readdir(dir, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files = entries
    .filter((entry) => entry.endsWith(".json"))
    .map((entry) => entry.split(sep).join("/"))
    .sort();
  return Promise.all(
    files.map(async (path) => ({
      path,
      raw: await readFile(join(dir, path), "utf8"),
    })),
  );
}
