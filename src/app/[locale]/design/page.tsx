import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { Guilloche } from "@/components/passport/Guilloche";
import { SortableListDemo } from "@/components/reading/SortableListDemo";
import { Stamp, type StampLevel } from "@/components/passport/Stamp";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { parseThemeTokens } from "@/lib/design/css-tokens";
import type { Skill } from "@/lib/exam/format";

const TOKENS = [
  "paper",
  "sheet",
  "ink",
  "ink-soft",
  "line",
  "hairline",
  "cover",
  "on-cover",
  "foil",
  "foil-ink",
  "entry",
  "refusal",
  "guilloche",
  "focus",
] as const;

const TYPE_SCALE = [
  ["text-4xl", "51.9"],
  ["text-3xl", "41.5"],
  ["text-2xl", "33.2"],
  ["text-xl", "26.6"],
  ["text-lg", "21.3"],
  ["text-base", "17"],
  ["text-sm", "13.6"],
  ["text-xs", "12"],
] as const;

const STAMPS: {
  skill: Skill;
  level: StampLevel;
  tone: "entry" | "foil" | "ink";
  rotate: number;
}[] = [
  { skill: "core", level: "A2", tone: "ink", rotate: -9 },
  { skill: "reading", level: "B1", tone: "entry", rotate: 4 },
  { skill: "listening", level: "B2", tone: "entry", rotate: -5 },
  { skill: "writing", level: "C", tone: "foil", rotate: 7 },
  { skill: "speaking", level: "C", tone: "foil", rotate: -3 },
];

const H2 = "font-semi-expanded text-xl font-bold";

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
  const t = await getTranslations();
  const format = await getFormatter();
  const tokens = await readThemeTokens();
  const date = format.dateTime(new Date(2026, 9, 18), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <>
      <PageHeader title={t("Design.title")} lead={t("Design.lead")} />

      <section aria-labelledby="design-colours">
        <h2 id="design-colours" className={H2}>
          {t("Design.colours")}
        </h2>
        <ul className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
      </section>

      <section aria-labelledby="design-type" className="mt-16">
        <h2 id="design-type" className={H2}>
          {t("Design.type")}
        </h2>
        <ul className="mt-5 space-y-3">
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
        <p className="mt-8 text-3xl font-black tracking-tight font-expanded">
          Archivo 125 %
        </p>
        <p lang="en" className="prose-reading mt-4 text-lg">
          Not only did the council close the library, but it also sold the
          building before anyone could object. Hardly had the news broken when
          residents began organising a protest.
        </p>
      </section>

      <section aria-labelledby="design-buttons" className="mt-16">
        <h2 id="design-buttons" className={H2}>
          {t("Design.buttons")}
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="primary">{t("Design.primary")}</Button>
          <Button>{t("Design.secondary")}</Button>
          <Button variant="ghost">{t("Design.ghost")}</Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <Button variant="primary" size="lg">
            {t("Design.primary")}
          </Button>
          <Button size="lg">{t("Design.secondary")}</Button>
        </div>
        <p className="mt-4 text-sm text-ink-soft">{t("Design.focusHint")}</p>
      </section>

      <section aria-labelledby="design-sortable" className="mt-16 max-w-[68ch]">
        <h2 id="design-sortable" className={H2}>
          {t("Design.sortable")}
        </h2>
        <p className="mt-1 text-ink-soft">{t("Design.sortableHint")}</p>
        <div className="mt-5">
          <SortableListDemo />
        </div>
      </section>

      <section aria-labelledby="design-stamps" className="mt-16">
        <h2 id="design-stamps" className={H2}>
          {t("Design.stamps")}
        </h2>
        <ul className="mt-5 flex flex-wrap gap-6">
          {STAMPS.map(({ skill, level, tone, rotate }) => {
            const caption = t(`Skills.${skill}`);
            return (
              <li key={skill}>
                <Stamp
                  skill={skill}
                  level={level}
                  caption={caption}
                  date={date}
                  tone={tone}
                  rotate={rotate}
                  label={t("Stamp.label", { level, caption })}
                />
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="design-guilloche" className="mt-16">
        <h2 id="design-guilloche" className={H2}>
          {t("Design.guilloche")}
        </h2>
        <div className="mt-5 flex flex-wrap items-center gap-8">
          <Guilloche variant="rosette" className="w-48 text-guilloche" />
          <div className="on-cover w-full max-w-sm rounded-page bg-cover p-6">
            <Guilloche variant="band" className="h-10 w-full text-foil/60" />
          </div>
        </div>
      </section>
    </>
  );
}
