import { createLocalStore, parseJson } from "@/lib/storage/localStore";
import { EMPTY_FLASHCARDS, FlashcardsState } from "./deck";

export const parseFlashcards = (raw: string | null): FlashcardsState => {
  const result = FlashcardsState.safeParse(parseJson(raw));
  return result.success ? result.data : EMPTY_FLASHCARDS;
};

export const flashcardsStore = createLocalStore<FlashcardsState>(
  "sello:flashcards",
  parseFlashcards,
  EMPTY_FLASHCARDS,
);
