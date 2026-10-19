import { LockedNotice } from "@/components/access/LockedNotice";
import { getEntitlement } from "@/lib/access/entitlement";
import { lowestLevel } from "@/lib/access/rule";
import { canAccess } from "@/lib/access/tiers";
import { phrasesByFunction } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import type { FunctionalPhrase } from "@/lib/content/schemas/lessons";
import { PhraseItem } from "./PhraseItem";

/** One function's phrases above A2: in full when the plan opens them, a one-line lock otherwise. */
export async function GatedPhrases({
  fn,
}: {
  fn: FunctionalPhrase["function"];
}) {
  const [content, tier] = await Promise.all([getContent(), getEntitlement()]);
  const paid = (
    phrasesByFunction(content).find((group) => group.function === fn)
      ?.phrases ?? []
  ).filter((phrase) => phrase.level !== "A2");
  const open = paid.filter((phrase) => canAccess(tier, phrase.level));
  const locked = paid.filter((phrase) => !canAccess(tier, phrase.level));
  const lowest = lowestLevel(locked.map((phrase) => phrase.level));
  return (
    <>
      {open.map((phrase) => (
        <PhraseItem key={phrase.id} phrase={phrase} />
      ))}
      {lowest ? (
        <li className="py-3">
          <LockedNotice level={lowest} count={locked.length} compact />
        </li>
      ) : null}
    </>
  );
}
