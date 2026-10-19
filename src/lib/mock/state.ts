import { z } from "zod";
import { ExamPartId } from "@/lib/content/schemas/common";
import { SKILLS } from "@/lib/exam/format";

/** A mock exam in progress or finished: rebuilt from its seed, resumed from `index`. */
export const MockState = z.object({
  version: z.literal(1),
  seed: z.int(),
  components: z.array(z.enum(SKILLS)).min(1),
  startedAt: z.number(),
  index: z.int().min(0),
  results: z.array(
    z.object({
      part: ExamPartId,
      correct: z.int().min(0),
      total: z.int().min(0),
    }),
  ),
  runningSince: z.number().nullable(),
  finishedAt: z.number().nullable(),
});
export type MockState = z.infer<typeof MockState>;
