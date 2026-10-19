import { LockedNotice } from "@/components/access/LockedNotice";
import { getEntitlement } from "@/lib/access/entitlement";
import { canAccess } from "@/lib/access/tiers";
import { lessonBySlug } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { LessonBody } from "./LessonBody";

/** A paid lesson's body for learners whose plan opens its level; the lock notice otherwise. */
export async function GatedLessonBody({ slug }: { slug: string }) {
  const [content, tier] = await Promise.all([getContent(), getEntitlement()]);
  const lesson = lessonBySlug(content, slug);
  if (!lesson) return null;
  return canAccess(tier, lesson.level) ? (
    <LessonBody slug={slug} />
  ) : (
    <LockedNotice level={lesson.level} />
  );
}
