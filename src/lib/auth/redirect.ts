/**
 * Where to send someone after an auth link or OAuth round trip. Only paths on this site are
 * allowed, so a crafted link cannot bounce a fresh session to another domain (open redirect).
 */
export function safeNext(next: string | null | undefined, fallback: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  // Backslashes and control characters can be read as "//" by some browsers.
  if (/[\\\u0000-\u001f]/.test(next)) return fallback;
  return next;
}
