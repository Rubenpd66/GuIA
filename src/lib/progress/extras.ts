import * as z from "zod/mini";
import { FlashcardsState } from "@/lib/flashcards/deck";
import { MockState } from "@/lib/mock/state";
import { LocalDay } from "./schema";

/** Data kept outside the progress record that still travels in an export file. */
export const ExportExtras = z.object({
  examDate: z.nullable(LocalDay),
  flashcards: FlashcardsState,
  /** The mock exam in progress or its last report. */
  mock: z.nullable(MockState),
});
export type ExportExtras = Partial<z.infer<typeof ExportExtras>>;
