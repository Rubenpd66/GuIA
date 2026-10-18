import type { BookId } from "@/config/books";

type BookReference = { readonly book: string; readonly unit: number };

/** Units of `book` referenced at least once, sorted. */
export function coveredUnits(
  references: readonly BookReference[],
  book: BookId,
): number[] {
  const units = new Set(
    references.filter((r) => r.book === book).map((r) => r.unit),
  );
  return [...units].sort((a, b) => a - b);
}

/** Units 1…`total` of `book` that no reference points to. */
export function findUncoveredUnits(
  references: readonly BookReference[],
  book: BookId,
  total: number,
): number[] {
  const covered = new Set(coveredUnits(references, book));
  return Array.from({ length: total }, (_, i) => i + 1).filter(
    (unit) => !covered.has(unit),
  );
}
