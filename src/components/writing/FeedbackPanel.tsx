"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import {
  requestFeedback,
  feedbackQuota,
  type FeedbackResult,
} from "@/lib/ai/actions";
import type { Feedback } from "@/lib/ai/feedback";
import { useTier } from "@/lib/access/useTier";
import { useUser } from "@/lib/auth/useUser";
import type { RubricCriterion } from "@/lib/trainer/writing";

const CONSENT_KEY = "sello:ai-consent";

function readConsent() {
  try {
    return globalThis.localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}
function saveConsent() {
  try {
    globalThis.localStorage.setItem(CONSENT_KEY, "1");
  } catch {
    // Blocked storage: the notice is simply shown again next time.
  }
}

const noSubscription = () => () => {};

type Quota = { used: number; cap: number };

/** AI feedback on the texts just written; only for paid plans, and only after consent. */
export function FeedbackPanel({
  taskId,
  texts,
}: {
  taskId: string;
  texts: Record<string, string>;
}) {
  const t = useTranslations("Writing.feedback");
  const tRubric = useTranslations("Writing.rubric");
  const locale = useLocale() === "en" ? "en" : "es";
  const user = useUser();
  const tier = useTier();
  const paid = tier !== undefined && tier !== "free";
  const [quota, setQuota] = useState<Quota | null>(null);
  // Stored consent is read after hydration (the server snapshot is false); a tick this visit also counts.
  const stored = useSyncExternalStore(noSubscription, readConsent, () => false);
  const [agreed, setAgreed] = useState(false);
  const consent = stored || agreed;
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<FeedbackResult>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const consentId = useId();

  useEffect(() => {
    if (!paid) return;
    let alive = true;
    void feedbackQuota().then((q) => alive && setQuota(q));
    return () => {
      alive = false;
    };
  }, [paid]);
  useEffect(() => {
    if (result?.status === "ok") headingRef.current?.focus();
  }, [result]);

  if (user === undefined || (user && tier === undefined)) return null;

  const heading = (
    <h3 id={`${consentId}-title`} className="text-lg font-bold">
      {t("title")}
    </h3>
  );
  if (!user)
    return (
      <section
        aria-labelledby={`${consentId}-title`}
        className="max-w-[68ch] space-y-3 rounded-card border border-dashed border-line bg-surface p-5"
      >
        {heading}
        <p className="text-ink-soft">{t("signedOut")}</p>
        <ButtonLink variant="primary" href="/sign-in">
          {t("signIn")}
        </ButtonLink>
      </section>
    );
  if (!paid)
    return (
      <section
        aria-labelledby={`${consentId}-title`}
        className="max-w-[68ch] space-y-3 rounded-card border border-dashed border-line bg-surface p-5"
      >
        {heading}
        <p className="text-ink-soft">{t("noPlan")}</p>
        <ButtonLink variant="primary" href="/plans">
          {t("seePlans")}
        </ButtonLink>
      </section>
    );

  const left = quota ? Math.max(quota.cap - quota.used, 0) : null;
  const hasText = Object.values(texts).some((text) => text.trim() !== "");
  const error = result?.status === "error" ? result.message : null;
  const blocked = error === "budget" || (left !== null && left === 0);

  async function ask() {
    setAsking(true);
    setResult(undefined);
    try {
      const next = await requestFeedback({ taskId, texts, locale, consent });
      setResult(next);
      if (next.status === "ok")
        setQuota((q) => q && { ...q, used: q.cap - next.remaining });
      else if (next.status === "error" && next.message === "limit")
        setQuota((q) => q && { ...q, used: q.cap });
    } catch {
      setResult({ status: "error", message: "failed" });
    } finally {
      setAsking(false);
    }
  }

  return (
    <section
      aria-labelledby={`${consentId}-title`}
      className="max-w-[68ch] space-y-4 rounded-card border border-line bg-surface p-5"
    >
      <h3 id={`${consentId}-title`} className="text-lg font-bold">
        {t("title")}
      </h3>
      <p className="text-ink-soft">{t("unofficial")}</p>
      {!consent ? (
        <label className="flex min-h-11 items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0"
            onChange={(event) => {
              if (event.target.checked) saveConsent();
              setAgreed(event.target.checked);
            }}
          />
          <span>{t("consent")}</span>
        </label>
      ) : null}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Button
          variant="primary"
          disabled={asking || !consent || !hasText || blocked}
          onClick={ask}
        >
          {asking ? t("asking") : t("ask")}
        </Button>
        {left !== null ? (
          <p className="text-sm text-ink-soft">{t("left", { count: left })}</p>
        ) : null}
      </div>
      <div role="status" aria-live="polite">
        {error ? <p className="text-danger">{t(`errors.${error}`)}</p> : null}
        {asking ? <p className="text-ink-soft">{t("wait")}</p> : null}
      </div>
      {result?.status === "ok" ? (
        <FeedbackResultView
          feedback={result.feedback}
          headingRef={headingRef}
          criterionLabel={(key) => tRubric(key)}
        />
      ) : null}
    </section>
  );
}

function FeedbackResultView({
  feedback,
  headingRef,
  criterionLabel,
}: {
  feedback: Feedback;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
  criterionLabel: (key: RubricCriterion) => string;
}) {
  const t = useTranslations("Writing.feedback");
  return (
    <div className="space-y-6">
      <h4
        ref={headingRef}
        tabIndex={-1}
        className="text-lg font-bold focus:outline-none"
      >
        {t("resultTitle")}
      </h4>
      <ul className="space-y-3">
        {feedback.criteria.map((c) => (
          <li key={c.criterion}>
            <p className="font-semibold">{criterionLabel(c.criterion)}</p>
            <p className="prose-reading">{c.comment}</p>
          </li>
        ))}
      </ul>
      {feedback.corrections.length > 0 ? (
        <div className="space-y-3">
          <h5 className="font-bold">{t("corrections")}</h5>
          <ul className="space-y-4">
            {feedback.corrections.map((c, i) => (
              <li key={i} className="space-y-1">
                <p lang="en">
                  <del className="text-ink-soft">{c.original}</del>{" "}
                  <span className="sr-only">{t("becomes")}</span>
                  <span aria-hidden="true">→</span>{" "}
                  <strong>{c.corrected}</strong>
                </p>
                <p className="text-sm text-ink-soft">{c.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {feedback.improved.length > 0 ? (
        <div className="space-y-3">
          <h5 className="font-bold">{t("improved")}</h5>
          {feedback.improved.map((item) => (
            <p
              key={item.key}
              lang="en"
              className="prose-reading rounded-card bg-canvas p-4 whitespace-pre-line"
            >
              {item.text}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
