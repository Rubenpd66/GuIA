import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/Wordmark";
import { LevelBadge } from "@/components/content/LevelBadge";
import { SortableListDemo } from "@/components/reading/SortableListDemo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MotionDemo } from "@/components/ui/MotionDemo";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Section, SectionStack } from "@/components/ui/Section";
import { parseThemeTokens } from "@/lib/design/css-tokens";

const TOKENS = [
  "canvas",
  "surface",
  "ink",
  "ink-soft",
  "line",
  "hairline",
  "accent",
  "on-accent",
  "success",
  "danger",
  "reward",
  "on-reward",
  "reward-ink",
  "focus",
  "level-a2",
  "level-b1",
  "level-b2",
  "level-c1",
] as const;

const TYPE_SCALE = [
  ["text-xs", 12],
  ["text-sm", 13.6],
  ["text-base", 17],
  ["text-lg", 21.25],
  ["text-xl", 26.6],
  ["text-2xl", 33.2],
  ["text-3xl", 41.5],
  ["text-4xl", 51.9],
] as const;

const LEVELS = ["A2", "B1", "B2", "C1"] as const;

/** The swatches show the real values from globals.css, read once at build time. */
async function readThemeTokens() {
  "use cache";
  const css = await readFile(
    join(process.cwd(), "src/app/globals.css"),
    "utf8",
  );
  return parseThemeTokens(css);
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Design");
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function DesignPage() {
  const t = await getTranslations("Design");
  const tokens = await readThemeTokens();

  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <SectionStack>
        <Section id="design-brand" title={t("brand")}>
          <Wordmark className="text-3xl" />
        </Section>

        <Section id="design-colours" title={t("colours")}>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TOKENS.map((token) => (
              <li key={token}>
                <div
                  className="h-16 rounded-control border border-hairline"
                  style={{ backgroundColor: `var(--${token})` }}
                />
                <p className="mt-2 font-semibold">{token}</p>
                <p className="text-sm text-ink-soft tabular-nums">
                  {tokens.light[token]} / {tokens.dark[token]}
                </p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="design-type" title={t("type")}>
          <ul className="space-y-3">
            {TYPE_SCALE.map(([className, px]) => (
              <li key={className} className="flex items-baseline gap-4">
                <span className="w-24 shrink-0 text-sm text-ink-soft tabular-nums">
                  {px} px
                </span>
                <span className={`${className} truncate font-semibold`}>
                  Cruza el B2. Llega al C.
                </span>
              </li>
            ))}
          </ul>
          <p lang="en" className="prose-reading mt-8 text-lg">
            Not only did the council close the library, but it also sold the
            building before anyone could object. Hardly had the news broken when
            residents began organising a protest.
          </p>
        </Section>

        <Section id="design-buttons" title={t("buttons")}>
          <div className="flex flex-wrap gap-3">
            <Button variant="primary">{t("primary")}</Button>
            <Button>{t("secondary")}</Button>
            <Button variant="ghost">{t("ghost")}</Button>
            <Button disabled>{t("disabled")}</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-3">
            <Button variant="primary" size="lg">
              {t("primary")}
            </Button>
            <Button size="lg">{t("secondary")}</Button>
          </div>
          <p className="mt-4 text-sm text-ink-soft">{t("focusHint")}</p>
        </Section>

        <Section id="design-cards" title={t("cards")} lead={t("cardsLead")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <h3 className="font-bold">{t("cardTitle")}</h3>
              <p className="mt-1 text-ink-soft">{t("cardBody")}</p>
            </Card>
            <Card href="/design">
              <h3 className="font-bold">{t("cardLinkTitle")}</h3>
              <p className="mt-1 text-ink-soft">{t("cardLinkBody")}</p>
            </Card>
          </div>
        </Section>

        <Section id="design-levels" title={t("levels")}>
          <ul className="flex flex-wrap gap-3">
            {LEVELS.map((level) => (
              <li key={level}>
                <LevelBadge level={level} />
              </li>
            ))}
          </ul>
          <div className="mt-6 max-w-sm space-y-4">
            <ProgressBar value={0.25} label={t("progress", { value: 25 })} />
            <ProgressBar value={0.64} label={t("progress", { value: 64 })} />
          </div>
        </Section>

        <Section id="design-motion" title={t("motion")} lead={t("motionLead")}>
          <div className="max-w-[68ch]">
            <MotionDemo
              replay={t("replay")}
              options={[t("optionIdle"), t("optionCorrect"), t("optionWrong")]}
              progressLabel={t("progress", { value: 64 })}
            />
          </div>
        </Section>

        <Section
          id="design-sortable"
          title={t("sortable")}
          lead={t("sortableHint")}
        >
          <div className="max-w-[68ch]">
            <SortableListDemo />
          </div>
        </Section>
      </SectionStack>
    </>
  );
}
