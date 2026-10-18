import { z } from "zod";
import { CoreGrammarExercise, CoreVocabularyExercise } from "./core";
import {
  Listening1Exercise,
  Listening2Exercise,
  Listening3Exercise,
  Listening4Exercise,
} from "./listening";
import {
  Reading1Exercise,
  Reading2Exercise,
  Reading3Exercise,
  Reading4Exercise,
} from "./reading";
import {
  Speaking1Exercise,
  Speaking2Exercise,
  Speaking3Exercise,
  Speaking4Exercise,
} from "./speaking";
import {
  Writing1Exercise,
  Writing2Exercise,
  Writing3Exercise,
  Writing4Exercise,
} from "./writing";

export const Exercise = z.discriminatedUnion("examPart", [
  CoreGrammarExercise,
  CoreVocabularyExercise,
  Reading1Exercise,
  Reading2Exercise,
  Reading3Exercise,
  Reading4Exercise,
  Listening1Exercise,
  Listening2Exercise,
  Listening3Exercise,
  Listening4Exercise,
  Writing1Exercise,
  Writing2Exercise,
  Writing3Exercise,
  Writing4Exercise,
  Speaking1Exercise,
  Speaking2Exercise,
  Speaking3Exercise,
  Speaking4Exercise,
]);
export type Exercise = z.infer<typeof Exercise>;
