import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { MockExam } from "@/components/assessment/MockExam";
import { PageHeader } from "@/components/ui/PageHeader";
import { exercisesOfPart } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import type { ExamPart } from "@/lib/exam/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.mockExam");
  return { title: t("title"), description: t("lead") };
}

const parts = <P extends ExamPart>(
  content: Awaited<ReturnType<typeof getContent>>,
  list: P[],
) => list.flatMap((part) => exercisesOfPart(content, part));

async function Exam() {
  const content = await getContent();
  return (
    <MockExam
      bank={{
        grammar: exercisesOfPart(content, "core-grammar"),
        vocabulary: exercisesOfPart(content, "core-vocabulary"),
        reading: parts(content, [
          "reading-1",
          "reading-2",
          "reading-3",
          "reading-4",
        ]),
        listening: parts(content, [
          "listening-1",
          "listening-2",
          "listening-3",
          "listening-4",
        ]),
        writing: parts(content, [
          "writing-1",
          "writing-2",
          "writing-3",
          "writing-4",
        ]),
        speaking: parts(content, [
          "speaking-1",
          "speaking-2",
          "speaking-3",
          "speaking-4",
        ]),
      }}
    />
  );
}

export default async function MockExamPage() {
  const t = await getTranslations("Sections.mockExam");
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="h-24 max-w-md rounded-control bg-hairline"
          />
        }
      >
        <Exam />
      </Suspense>
    </>
  );
}
