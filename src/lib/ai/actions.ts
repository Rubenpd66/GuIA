"use server";

import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  AI_MODEL,
  AI_MONTHLY_BUDGET_USD,
  AI_PRICE_PER_MTOK,
} from "@/config/ai";
import { getEntitlement } from "@/lib/access/entitlement";
import { canAccess } from "@/lib/access/tiers";
import { exercisesOfPart } from "@/lib/content";
import { getContent } from "@/lib/content/load";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";
import { writingItems, type WritingExercise } from "@/lib/trainer/writing";
import {
  FeedbackSchema,
  MAX_TEXT_CHARS,
  buildPrompt,
  capFor,
  tidy,
  type Feedback,
} from "./feedback";
import { anthropicServer } from "./server";

export type FeedbackResult =
  | { status: "ok"; feedback: Feedback; remaining: number }
  | {
      status: "error";
      message:
        | "unavailable"
        | "signedOut"
        | "noPlan"
        | "consent"
        | "limit"
        | "budget"
        | "invalid"
        | "failed";
    };

const Args = z.object({
  taskId: z.string().min(1).max(100),
  texts: z.record(z.string().max(100), z.string().max(MAX_TEXT_CHARS)),
  locale: z.enum(["es", "en"]),
  consent: z.literal(true),
});

const fail = (
  message: Extract<FeedbackResult, { status: "error" }>["message"],
) => ({ status: "error", message }) as const;

async function writingTask(id: string): Promise<WritingExercise | undefined> {
  const index = await getContent();
  return (["writing-1", "writing-2", "writing-3", "writing-4"] as const)
    .flatMap((part) => exercisesOfPart(index, part) as WritingExercise[])
    .find((task) => task.id === id);
}

/**
 * Asks Claude for feedback on a Writing task. Order matters: configuration, session, plan,
 * consent, input, then one use is reserved before the call and given back if the call fails.
 */
export async function requestFeedback(input: {
  taskId: string;
  texts: Record<string, string>;
  locale: "es" | "en";
  consent: boolean;
}): Promise<FeedbackResult> {
  const anthropic = anthropicServer();
  const admin = supabaseAdmin();
  if (!anthropic || !admin || !supabaseConfigured) return fail("unavailable");

  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return fail("signedOut");

  const tier = await getEntitlement();
  const cap = capFor(tier);
  if (cap <= 0) return fail("noPlan");

  if (input.consent !== true) return fail("consent");
  const parsed = Args.safeParse(input);
  if (!parsed.success) return fail("invalid");
  const { taskId, texts, locale } = parsed.data;

  const task = await writingTask(taskId);
  if (!task || !canAccess(tier, task.cefrLevel)) return fail("invalid");
  const keys = new Set(writingItems(task).map((item) => item.key));
  if (Object.keys(texts).some((key) => !keys.has(key))) return fail("invalid");
  if (!Object.values(texts).some((text) => text.trim() !== ""))
    return fail("invalid");

  const reserved = await admin.rpc("ai_reserve", {
    p_user: userId,
    p_cap: cap,
    p_budget_usd: AI_MONTHLY_BUDGET_USD,
    p_in_price: AI_PRICE_PER_MTOK.input,
    p_out_price: AI_PRICE_PER_MTOK.output,
  });
  const row = reserved.data?.[0];
  if (reserved.error || !row) return fail("failed");
  if (row.out_status === "limit") return fail("limit");
  if (row.out_status === "budget") return fail("budget");

  const release = () =>
    admin.rpc("ai_release", { p_user: userId, p_month: row.out_month });

  try {
    const { system, user } = buildPrompt(task, texts, locale);
    const response = await anthropic.messages.parse({
      model: AI_MODEL,
      max_tokens: 8000,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: zodOutputFormat(FeedbackSchema) },
    });
    // Tokens were spent even when the answer is unusable, so they are always recorded.
    // shortcut: requests in flight are not counted against the budget, so it can overshoot by a few cents.
    await admin.rpc("ai_settle", {
      p_user: userId,
      p_month: row.out_month,
      p_in: response.usage.input_tokens,
      p_out: response.usage.output_tokens,
    });
    if (response.stop_reason !== "end_turn" || !response.parsed_output) {
      await release();
      return fail("failed");
    }
    return {
      status: "ok",
      feedback: tidy(response.parsed_output, task),
      remaining: Math.max(cap - row.out_uses, 0),
    };
  } catch (error) {
    console.error(
      "sello: could not get AI feedback",
      (error as { status?: number }).status,
    );
    await release();
    return fail("failed");
  }
}

/** Uses taken this UTC month and the plan's cap, for the signed-in learner (RLS: own rows). */
export async function feedbackQuota(): Promise<{
  used: number;
  cap: number;
} | null> {
  if (!supabaseConfigured) return null;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;
  const cap = capFor(await getEntitlement());
  const month = new Date().toISOString().slice(0, 7) + "-01";
  const { data: row, error } = await supabase
    .from("ai_usage")
    .select("uses")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle<{ uses: number }>();
  if (error) return null;
  return { used: row?.uses ?? 0, cap };
}
