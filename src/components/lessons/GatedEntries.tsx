import { LockedNotice } from "@/components/access/LockedNotice";
import { LevelBadge } from "@/components/content/LevelBadge";
import { Icon } from "@/components/icons/Icon";
import { getEntitlement } from "@/lib/access/entitlement";
import { lowestLevel } from "@/lib/access/rule";
import { canAccess } from "@/lib/access/tiers";
import { entriesOfGroup } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { VocabEntry } from "./VocabEntry";

/**
 * A group's entries above A2. Learners whose plan opens a level read them in full; for the
 * rest only the headword and level show, as the preview of what a plan adds.
 */
export async function GatedEntries({ group }: { group: string }) {
  const [content, tier] = await Promise.all([getContent(), getEntitlement()]);
  const paid = entriesOfGroup(content, group).filter(
    (entry) => entry.level !== "A2",
  );
  const open = paid.filter((entry) => canAccess(tier, entry.level));
  const locked = paid.filter((entry) => !canAccess(tier, entry.level));
  const lowest = lowestLevel(locked.map((entry) => entry.level));
  return (
    <>
      {open.map((entry) => (
        <VocabEntry key={entry.id} entry={entry} />
      ))}
      {locked.map((entry) => (
        <li
          key={entry.id}
          lang="en"
          className="flex flex-wrap items-center gap-x-3 py-4 text-ink-soft"
        >
          <span className="text-lg font-bold">
            {entry.headword}
          </span>
          <LevelBadge level={entry.level} className="h-6 min-w-8 text-xs" />
          <Icon name="lock" className="size-4" />
        </li>
      ))}
      {lowest ? (
        <li className="py-5">
          <LockedNotice level={lowest} count={locked.length} />
        </li>
      ) : null}
    </>
  );
}
