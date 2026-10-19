import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";

type Namespace = "Terms" | "Cookies";

/** A legal page made of `<topic>Title` / `<topic>Body` message pairs. */
export async function LegalSections({
  namespace,
  topics,
}: {
  namespace: Namespace;
  topics: readonly string[];
}) {
  const t = await getTranslations(namespace);
  // Keys are built from the topic lists below, which the messages test keeps in step.
  const text = t as unknown as (key: string) => string;
  return (
    <>
      <PageHeader title={t("title")} lead={t("lead")} />
      <div className="space-y-8">
        {topics.map((topic) => (
          <section key={topic} aria-labelledby={`${namespace}-${topic}`}>
            <h2 id={`${namespace}-${topic}`} className="text-lg font-bold">
              {text(`${topic}Title`)}
            </h2>
            <p className="prose-reading mt-2">{text(`${topic}Body`)}</p>
          </section>
        ))}
      </div>
    </>
  );
}
