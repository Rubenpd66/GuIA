"use client";

import dynamic from "next/dynamic";
import { useBank } from "@/lib/content/useBank";
import { BankStatus } from "./BankStatus";

// The page only downloads the trainer's code with its cards.
const FlashcardTrainer = dynamic(() =>
  import("@/components/flashcards/FlashcardTrainer").then(
    (m) => m.FlashcardTrainer,
  ),
);

/** Flashcards need the whole deck to count what is due, so they wait for it. */
export function FlashcardsWithDeck() {
  const deck = useBank("flashcards");
  if (deck.status !== "ready") return <BankStatus state={deck} />;
  return <FlashcardTrainer cards={deck.data} />;
}
