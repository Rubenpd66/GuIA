const STORAGE_KEY = "sello:writing-drafts";
/** Oldest drafts are dropped past this, so abandoned tasks do not pile up. */
export const MAX_DRAFTS = 60;

type Drafts = Record<string, { text: string; savedAt: number }>;
type Store = Pick<Storage, "getItem" | "setItem">;

// Read lazily inside each try: merely touching localStorage throws when it is blocked.
const storeOr = (store?: Store): Store => store ?? globalThis.localStorage;

function readAll(store?: Store): Drafts {
  try {
    const data: unknown = JSON.parse(
      storeOr(store).getItem(STORAGE_KEY) ?? "{}",
    );
    return typeof data === "object" && data !== null ? (data as Drafts) : {};
  } catch {
    return {};
  }
}

function writeAll(store: Store | undefined, drafts: Drafts) {
  try {
    storeOr(store).setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch {
    // Blocked or full storage: the text stays in the editor for this page view.
  }
}

/** The saved text for one item (see `writingItems` keys), or "" when there is none. */
export function readDraft(key: string, store?: Store): string {
  const text = readAll(store)[key]?.text;
  return typeof text === "string" ? text : "";
}

export function saveDraft(
  key: string,
  text: string,
  savedAt: number,
  store?: Store,
) {
  const drafts = readAll(store);
  if (text) drafts[key] = { text, savedAt };
  else delete drafts[key];
  const kept = Object.entries(drafts)
    .sort(([, a], [, b]) => b.savedAt - a.savedAt)
    .slice(0, MAX_DRAFTS);
  writeAll(store, Object.fromEntries(kept));
}

export function clearDrafts(keys: readonly string[], store?: Store) {
  const drafts = readAll(store);
  keys.forEach((key) => delete drafts[key]);
  writeAll(store, drafts);
}
