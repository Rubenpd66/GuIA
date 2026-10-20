import type { CSSProperties } from "react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Tilt } from "@/components/ui/Tilt";
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
    <div className="enter-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {GROUPS.map(({ skill, parts }, i) => (
        <div key={skill} style={{ "--i": i } as CSSProperties}>
          <Tilt className="h-full">
            <Card className="h-full">
              <section aria-labelledby={`skill-${skill}`}>
                <Heading id={`skill-${skill}`} className="text-lg font-bold">
                  {t(`Skills.${skill}`)}
                </Heading>
                <ul className="mt-3 border-t border-hairline">
                  {parts.map((part) => {
                    const number = partNumber(part);
                    return (
                      <li
                        key={part}
                        className="border-b border-hairline last:border-b-0"
                      >
                        <Link
                          href={{
                            pathname: "/practice/[part]",
                            params: { part },
                          }}
                          className="pressable flex min-h-14 items-baseline gap-3 py-3 hover-fine:text-accent"
                        >
                          {number === null ? null : (
                            <span className="w-14 shrink-0 text-sm font-semibold text-ink-soft tabular-nums">
                              {t("Practice.partNumber", { number })}
                            </span>
                          )}
                          <span className="font-medium">
                            {t(`Parts.${part}`)}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </Card>
          </Tilt>
        </div>
      ))}
    </div>
  );
}
