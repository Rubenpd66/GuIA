type Result<Row> = { data: Row | null; error: unknown };

/**
 * One read per user shared by every component for a short while, so a page full of lock marks
 * asks once. A failed read is "unknown", never "no plan", and is not kept: the next caller
 * tries again. The time limit lets a plan bought a moment ago show up without a reload.
 */
export function createRowCache<Row>(
  fetch: (userId: string) => PromiseLike<Result<Row>>,
  ttlMs: number,
) {
  const reads = new Map<
    string,
    { at: number; read: Promise<{ row: Row | null } | null> }
  >();
  return function read(userId: string, now: number) {
    const cached = reads.get(userId);
    if (cached && now - cached.at <= ttlMs) return cached.read;
    const read = Promise.resolve(fetch(userId))
      .then(({ data, error }) => (error ? null : { row: data }))
      .catch(() => null)
      .then((result) => {
        if (!result) reads.delete(userId);
        return result;
      });
    reads.set(userId, { at: now, read });
    return read;
  };
}
