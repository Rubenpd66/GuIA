import { join } from "node:path";
import { readContentDir } from "./fs";
import { buildContentIndex, type ContentIndex } from "./index";
import { ContentFile } from "./schemas/content-file";
import { stripBom } from "./text";
import { formatReport, validateContentSet } from "./validate";

/**
 * Reads, validates and indexes everything under content/. It runs while the site is
 * built and the result is cached, so pages never read the disk at request time.
 */
export async function getContent(): Promise<ContentIndex> {
  "use cache";
  const sources = await readContentDir(join(process.cwd(), "content"));
  const report = validateContentSet(sources);
  if (report.errors.length > 0) {
    throw new Error(`Invalid content:\n${formatReport(report)}`);
  }
  return buildContentIndex(
    sources.map((source) =>
      ContentFile.parse(JSON.parse(stripBom(source.raw))),
    ),
  );
}
