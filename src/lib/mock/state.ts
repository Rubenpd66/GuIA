import * as z from "zod/mini";
import { EXAM_PARTS, SKILLS } from "@/lib/exam/format";

/** A mock exam in progress or finished: rebuilt from its seed, resumed from `index`. */
export const MockState = z.object({
  version: z.literal(1),
  seed: z.int(),
  components: z.array(z.enum(SKILLS)).check(z.minLength(1)),
  startedAt: z.number(),
  index: z.int().check(z.minimum(0)),
  results: z.array(
    z.object({
      part: z.enum(EXAM_PARTS),
      correct: z.int().check(z.minimum(0)),
      total: z.int().check(z.minimum(0)),
    }),
  ),
  runningSince: z.nullable(z.number()),
  finishedAt: z.nullable(z.number()),
});
export type MockState = z.infer<typeof MockState>;
