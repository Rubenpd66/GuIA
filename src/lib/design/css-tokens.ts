type Tokens = Record<string, string>;

const PROPERTY = /--([\w-]+)\s*:\s*(#[0-9a-f]{6})\s*;/gi;

function readBlock(css: string, selector: RegExp): Tokens {
  const body = selector.exec(css)?.[1] ?? "";
  return Object.fromEntries(
    [...body.matchAll(PROPERTY)].map((m) => [m[1], m[2]]),
  );
}

/** Reads the hex colour tokens of the light (`:root`) and dark (`[data-theme="dark"]`) themes. */
export function parseThemeTokens(css: string): { light: Tokens; dark: Tokens } {
  return {
    light: readBlock(css, /:root\s*\{([^}]*)\}/),
    dark: readBlock(css, /\[data-theme="dark"\]\s*\{([^}]*)\}/),
  };
}
