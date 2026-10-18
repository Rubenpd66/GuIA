/**
 * Reference books used only as a coverage index and for "Further study" links
 * (book and unit number). Their text, examples and exercises are never copied.
 */
export const BOOKS = {
  egu: { title: "English Grammar in Use", edition: 5, units: 145 },
  evu: {
    title: "English Vocabulary in Use Upper-intermediate",
    edition: 4,
    units: 101,
  },
} as const;

export type BookId = keyof typeof BOOKS;

export const BOOK_IDS = Object.keys(BOOKS) as BookId[];
