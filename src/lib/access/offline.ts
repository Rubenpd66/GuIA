/** The service worker's cache of pages, RSC data and banks (`PAGES` in public/sw.js). */
const PAGES_CACHE = "sello-pages-v1";

/**
 * Forgets the pages kept for offline use, which may hold one learner's paid content, when they
 * sign out or another account signs in on this browser. Never throws.
 */
export async function clearCachedPages(
  store: Pick<CacheStorage, "delete"> | undefined = globalThis.caches,
): Promise<void> {
  try {
    await store?.delete(PAGES_CACHE);
  } catch {
    // Storage blocked or unavailable: nothing was cached.
  }
}

/**
 * Calls `onChange` whenever the signed-in user is replaced or signs out, however that happens
 * (button, expiry, another tab). The first report only sets the starting point.
 */
export function sessionWatcher(onChange: () => void) {
  let last: string | null | undefined;
  return (user: { id: string } | null) => {
    const id = user?.id ?? null;
    if (last !== undefined && last !== id) onChange();
    last = id;
  };
}
