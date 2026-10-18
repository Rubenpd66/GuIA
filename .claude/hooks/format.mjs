// PostToolUse hook: format the file Claude just wrote with the project's Prettier config.
import { readFile, writeFile } from "node:fs/promises";
import * as prettier from "prettier";

let raw = "";
for await (const chunk of process.stdin) raw += chunk;

const file = JSON.parse(raw).tool_input?.file_path ?? "";
if (/\.(tsx?|mts|mjs|json|css|md)$/.test(file)) {
  try {
    const options = await prettier.resolveConfig(file);
    const info = await prettier.getFileInfo(file, {
      ignorePath: ".prettierignore",
    });
    if (!info.ignored) {
      const source = await readFile(file, "utf8");
      const formatted = await prettier.format(source, {
        ...options,
        filepath: file,
      });
      if (formatted !== source) await writeFile(file, formatted);
    }
  } catch {
    // Syntax errors are reported by tsc and the tests; formatting is best effort.
  }
}
