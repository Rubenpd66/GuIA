const OWNER_KEY = "sello:sync-owner";

type Store = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// Read lazily inside each try: merely touching localStorage throws when it is blocked.
const storeOr = (store?: Store): Store => store ?? globalThis.localStorage;

/**
 * Marks this browser's study data as belonging to `userId`. True when it belonged to another
 * account (someone else signed in on a shared device): the caller clears it before syncing,
 * so one learner's data never ends up in another's account.
 */
export function claimOwner(userId: string, store?: Store): boolean {
  try {
    const owner = storeOr(store).getItem(OWNER_KEY);
    storeOr(store).setItem(OWNER_KEY, userId);
    return owner !== null && owner !== userId;
  } catch {
    return false;
  }
}

/** The local data no longer belongs to any account (it was kept after deleting one). */
export function releaseOwner(store?: Store) {
  try {
    storeOr(store).removeItem(OWNER_KEY);
  } catch {
    // Blocked storage holds no owner.
  }
}
