import { createLocalStore, parseJson } from "@/lib/storage/localStore";
import { ExamDate } from "./schema";

export const parseExamDate = (raw: string | null): string | null => {
  const result = ExamDate.safeParse(parseJson(raw));
  return result.success ? result.data : null;
};

export const examDateStore = createLocalStore<string | null>(
  "sello:exam-date",
  parseExamDate,
  null,
);
