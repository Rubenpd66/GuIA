import type { Skill } from "@/lib/exam/format";

type StampShape = {
  /** Outer border, in a 120×120 viewBox. */
  outer: string;
  /** Inner border. */
  inner: string;
  levelY: number;
  levelSize: number;
  captionY: number;
  /** Where the date goes; the triangle has no room for one. */
  dateY?: number;
};

/**
 * Each skill has its own stamp outline, as border stamps differ by country,
 * so skills can be told apart without relying on colour.
 */
export const STAMP_SHAPES: Record<Skill, StampShape> = {
  core: {
    outer: "M6 60A54 54 0 1 0 114 60A54 54 0 1 0 6 60Z",
    inner: "M16 60A44 44 0 1 0 104 60A44 44 0 1 0 16 60Z",
    levelY: 70,
    levelSize: 30,
    captionY: 84,
    dateY: 42,
  },
  reading: {
    outer: "M18 22H102L112 32V88L102 98H18L8 88V32Z",
    inner: "M24 30H96L104 38V82L96 90H24L16 82V38Z",
    levelY: 69,
    levelSize: 30,
    captionY: 82,
    dateY: 44,
  },
  listening: {
    outer: "M6 60A54 40 0 1 0 114 60A54 40 0 1 0 6 60Z",
    inner: "M15 60A45 31 0 1 0 105 60A45 31 0 1 0 15 60Z",
    levelY: 68,
    levelSize: 28,
    captionY: 80,
    dateY: 45,
  },
  writing: {
    outer: "M114 60L87 106.8L33 106.8L6 60L33 13.2L87 13.2Z",
    inner: "M104 60L82 98.1L38 98.1L16 60L38 21.9L82 21.9Z",
    levelY: 70,
    levelSize: 30,
    captionY: 84,
    dateY: 42,
  },
  speaking: {
    outer: "M60 8L112 100L8 100Z",
    inner: "M60 26L97 92L23 92Z",
    levelY: 78,
    levelSize: 26,
    captionY: 88,
  },
};
