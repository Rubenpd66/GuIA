import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { Link } from "@/i18n/navigation";
import { EXAM_FORMAT, partNumber } from "@/lib/exam/format";
import { LISTENING_PART_EXAM } from "@/lib/trainer/config";
import type { ListeningPart } from "@/lib/trainer/listening";
import { alternatesFor } from "@/lib/seo/alternates";

const H2 = " text-xl font-bold";
const PARTS = Object.keys(LISTENING_PART_EXAM) as ListeningPart[];
const STRATEGIES = ["s1", "s2", "s3", "s4"] as const;

const { part1, part2, part3, part4 } = EXAM_FORMAT.listening;
const TASK_VALUES = {
  "listening-1": { options: part1.options },
  "listening-2": { options: part2.options },
  "listening-3": { statements: part3.statements },
  "listening-4": { questions: part4.questions, options: part4.options },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Sections.listening");
  return {
    title: t("title"),
    description: t("lead"),
    alternates: await alternatesFor("/listening"),
  };
}

export default async function ListeningPage() {
  const t = await getTranslations();
  return (
    <>
      <PageHeader
        title={t("Sections.listening.title")}
        lead={t("Sections.listening.lead")}
      />
      <div className="max-w-[68ch] space-y-12">
        <p className="prose-reading">
          {t("ListeningPage.intro", { minutes: EXAM_FORMAT.listening.minutes })}
        </p>

        <section
          aria-labelledby="listening-voices"
          className="space-y-3 rounded-card bg-surface p-5"
        >
          <h2 id="listening-voices" className="font-semibold">
            {t("ListeningPage.voiceTitle")}
          </h2>
          <p>{t("ListeningPage.voiceBody")}</p>
          <Link
            href="/settings"
            className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4 hover:decoration-2"
          >
            {t("ListeningPage.settings")}
          </Link>
        </section>

        {PARTS.map((part) => (
          <section
            key={part}
            aria-labelledby={`listening-${part}`}
            className="space-y-4 border-t border-hairline pt-8"
          >
            <h2 id={`listening-${part}`} className={H2}>
              {t("ListeningPage.partTitle", {
                number: partNumber(part) ?? 0,
                name: t(`Parts.${part}`),
              })}
            </h2>
            <p className="prose-reading">
              {t(`ListeningStrategies.${part}.task`, TASK_VALUES[part])}
            </p>
            <p className="text-sm text-ink-soft">
              {t("ListeningPage.examNote", {
                plays: EXAM_FORMAT.listening.maxPlays,
              })}
            </p>
            <h3 className="font-semibold">{t("ListeningPage.strategies")}</h3>
            <ul className="list-disc space-y-2 pl-6">
              {STRATEGIES.map((key) => (
                <li key={key}>
                  {t(`ListeningStrategies.${part}.${key}`, TASK_VALUES[part])}
                </li>
              ))}
            </ul>
            <ButtonLink
              variant="primary"
              href={{ pathname: "/practice/[part]", params: { part } }}
            >
              {t("ListeningPage.practise", { number: partNumber(part) ?? 0 })}
            </ButtonLink>
          </section>
        ))}
      </div>
    </>
  );
}
