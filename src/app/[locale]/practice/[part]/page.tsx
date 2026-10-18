import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { PHASE_OF_SKILL } from "@/config/sections";
import {
  EXAM_PARTS,
  SKILL_OF_PART,
  isExamPart,
  partNumber,
  type ExamPart,
} from "@/lib/exam/format";

export function generateStaticParams() {
  return EXAM_PARTS.map((part) => ({ part }));
}

async function titleOf(part: ExamPart) {
  const t = await getTranslations();
  const name = t(`Parts.${part}`);
  const number = partNumber(part);
  return number === null
    ? t("Practice.coreTitle", { name })
    : t("Practice.title", {
        skill: t(`Skills.${SKILL_OF_PART[part]}`),
        number,
        name,
      });
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/practice/[part]">): Promise<Metadata> {
  const { part } = await params;
  return isExamPart(part) ? { title: await titleOf(part) } : {};
}

type Params = PageProps<"/[locale]/practice/[part]">["params"];

/** Reading the part inside Suspense keeps client navigation to this route instant. */
export default function PracticePartPage({ params }: { params: Params }) {
  return (
    <Suspense
      fallback={
        <div
          aria-hidden="true"
          className="h-24 max-w-md rounded-control bg-hairline"
        />
      }
    >
      <PracticePart params={params} />
    </Suspense>
  );
}

async function PracticePart({ params }: { params: Params }) {
  const { part } = await params;
  // Unknown parts are not prerendered and must not render a trainer.
  if (!isExamPart(part)) notFound();
  const t = await getTranslations();

  return (
    <>
      <PageHeader title={await titleOf(part)} />
      <EmptyState
        title={t("Coming.title")}
        body={t("Coming.body", { phase: PHASE_OF_SKILL[SKILL_OF_PART[part]] })}
        action={<ButtonLink href="/practice">{t("Nav.practice")}</ButtonLink>}
      />
    </>
  );
}
