import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PlacementTest } from "@/components/assessment/PlacementTest";
import { PageHeader } from "@/components/ui/PageHeader";
import { exercisesOfPart } from "@/lib/content";
import { getContent } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.placementTest");
  return { title: t("title"), description: t("lead") };
}

async function Test() {
  const content = await getContent();
  return (
    <PlacementTest
      bank={{
        grammar: exercisesOfPart(content, "core-grammar"),
        vocabulary: exercisesOfPart(content, "core-vocabulary"),
        reading: [
          ...exercisesOfPart(content, "reading-1"),
          ...exercisesOfPart(content, "reading-3"),
        ],
        listening1: exercisesOfPart(content, "listening-1"),
        listening2: exercisesOfPart(content, "listening-2"),
      }}
    />
  );
}

export default async function PlacementTestPage() {
  const t = await getTranslations("Sections.placementTest");
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
        <Test />
      </Suspense>
    </>
  );
}
