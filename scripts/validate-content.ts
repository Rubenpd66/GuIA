/**
 * Validates every JSON file under the given folder (default: content).
 * Usage: npm run validate:content
 * Exits with code 1 when there are errors; warnings never fail the build.
 */
import { readContentDir } from "../src/lib/content/fs";
import { formatReport, validateContentSet } from "../src/lib/content/validate";

async function main() {
  const dir = process.argv[2] ?? "content";
  const report = validateContentSet(await readContentDir(dir));
  console.log(formatReport(report));
  if (report.errors.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
