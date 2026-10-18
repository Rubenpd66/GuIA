import { getTranslations } from "next-intl/server";
import { SkillMark } from "@/components/passport/SkillMark";
import { Link } from "@/i18n/navigation";
import {
  EXAM_PARTS,
  SKILLS,
  SKILL_OF_PART,
  partNumber,
} from "@/lib/exam/format";

const GROUPS = SKILLS.map((skill) => ({
  skill,
  parts: EXAM_PARTS.filter((part) => SKILL_OF_PART[part] === skill),
}));

/** The 18 exam parts grouped by skill, each linking to its trainer. */
export async function PartsList({ headingLevel }: { headingLevel: 2 | 3 }) {
  const t = await getTranslations();
  const Heading = headingLevel === 2 ? "h2" : "h3";

  return (
    <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
      {GROUPS.map(({ skill, parts }) => (
        <section key={skill} aria-labelledby={`skill-${skill}`}>
          <Heading
            id={`skill-${skill}`}
            className="flex items-center gap-2.5 text-lg font-bold font-semi-expanded"
          >
            <SkillMark skill={skill} className="text-cover dark:text-foil" />
            {t(`Skills.${skill}`)}
          </Heading>
          <ul className="mt-3 border-t border-hairline">
            {parts.map((part) => {
              const number = partNumber(part);
              return (
                <li key={part} className="border-b border-hairline">
                  <Link
                    href={{ pathname: "/practice/[part]", params: { part } }}
                    className="flex min-h-14 items-baseline gap-3 py-3 transition-colors duration-150 hover:text-cover dark:hover:text-foil"
                  >
                    <span className="w-14 shrink-0 text-sm font-semibold text-ink-soft tabular-nums">
                      {number === null
                        ? ""
                        : t("Practice.partNumber", { number })}
                    </span>
                    <span className="font-medium">{t(`Parts.${part}`)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
