"use client";

import { useState } from "react";
import { moveItem } from "@/lib/trainer/reading";
import { SortableList } from "./SortableList";

const SENTENCES = [
  "Our street started a book swap last spring.",
  "At first, only a handful of neighbours used it.",
  "However, word soon spread through the local newsletter.",
  "Within a month, the shelf was too small for all the books.",
  "So the council offered us an old phone box to keep them in.",
];

/** Design page sample: the sortable list with a short text that starts in the wrong order. */
export function SortableListDemo() {
  const [order, setOrder] = useState([0, 3, 1, 4, 2]);
  return (
    <SortableList
      items={SENTENCES.map((text, i) => ({ id: `s${i}`, content: text }))}
      order={order}
      fixed={1}
      onMove={(from, to) => setOrder((current) => moveItem(current, from, to))}
    />
  );
}
