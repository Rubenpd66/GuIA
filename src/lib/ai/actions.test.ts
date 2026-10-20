import { beforeEach, describe, expect, it, vi } from "vitest";

const parse = vi.fn();
const rpc = vi.fn();
let claims: { sub: string } | null;
let tier: string;
let configured = true;

const task = {
  id: "w2-1",
  examPart: "writing-2",
  cefrLevel: "B1",
  context: "Club",
  prompt: "Write about the club.",
  models: {},
};

vi.mock("@/lib/supabase/env", () => ({
  get supabaseConfigured() {
    return configured;
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({
    auth: { getClaims: async () => ({ data: claims ? { claims } : null }) },
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ rpc }) }));
vi.mock("@/lib/access/entitlement", () => ({
  getEntitlement: async () => tier,
}));
vi.mock("@/lib/content/load", () => ({ getContent: async () => ({}) }));
vi.mock("@/lib/content", () => ({
  exercisesOfPart: (_: unknown, part: string) =>
    part === "writing-2" ? [task] : [],
}));
vi.mock("./server", () => ({
  anthropicServer: () => ({ messages: { parse } }),
}));

const { requestFeedback } = await import("./actions");

const good = {
  parsed_output: { criteria: [], corrections: [], improved: [] },
  stop_reason: "end_turn",
  usage: { input_tokens: 1000, output_tokens: 500 },
};
const call = (over: Partial<Parameters<typeof requestFeedback>[0]> = {}) =>
  requestFeedback({
    taskId: "w2-1",
    texts: { "w2-1#0": "Hello there" },
    locale: "es",
    consent: true,
    ...over,
  });
const names = () => rpc.mock.calls.map(([name]) => name);

beforeEach(() => {
  parse.mockReset();
  rpc.mockReset();
  claims = { sub: "user-1" };
  tier = "b1";
  configured = true;
  rpc.mockResolvedValue({
    data: [{ out_status: "ok", out_month: "2026-10-01", out_uses: 3 }],
    error: null,
  });
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("requestFeedback", () => {
  it("answers unavailable when accounts are not configured", async () => {
    configured = false;
    expect(await call()).toEqual({ status: "error", message: "unavailable" });
  });

  it("needs a session, a paid plan and consent, in that order, before touching the database", async () => {
    claims = null;
    expect(await call()).toEqual({ status: "error", message: "signedOut" });
    claims = { sub: "user-1" };
    tier = "free";
    expect(await call()).toEqual({ status: "error", message: "noPlan" });
    tier = "b1";
    expect(await call({ consent: false })).toEqual({
      status: "error",
      message: "consent",
    });
    expect(rpc).not.toHaveBeenCalled();
    expect(parse).not.toHaveBeenCalled();
  });

  it.each([
    ["an unknown task", { taskId: "nope" }],
    ["another task's key", { texts: { "w9-9#0": "x" } }],
    ["a text that is too long", { texts: { "w2-1#0": "x".repeat(4001) } }],
    ["only empty texts", { texts: { "w2-1#0": "  " } }],
  ])("rejects %s before reserving a use", async (_, over) => {
    expect(await call(over)).toEqual({ status: "error", message: "invalid" });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects a task above the plan's level", async () => {
    task.cefrLevel = "C1";
    expect(await call()).toEqual({ status: "error", message: "invalid" });
    task.cefrLevel = "B1";
  });

  it.each(["limit", "budget"])(
    "stops at %s without calling the model",
    async (s) => {
      rpc.mockResolvedValue({
        data: [{ out_status: s, out_month: "2026-10-01", out_uses: 0 }],
        error: null,
      });
      expect(await call()).toEqual({ status: "error", message: s });
      expect(parse).not.toHaveBeenCalled();
    },
  );

  it("settles the tokens and reports what is left on success", async () => {
    parse.mockResolvedValue(good);
    expect(await call()).toEqual({
      status: "ok",
      feedback: { criteria: [], corrections: [], improved: [] },
      remaining: 7,
    });
    expect(names()).toEqual(["ai_reserve", "ai_settle"]);
    expect(rpc).toHaveBeenLastCalledWith("ai_settle", {
      p_user: "user-1",
      p_month: "2026-10-01",
      p_in: 1000,
      p_out: 500,
    });
  });

  it.each([
    ["the provider throws", () => parse.mockRejectedValue({ status: 529 })],
    [
      "the model refuses",
      () => parse.mockResolvedValue({ ...good, stop_reason: "refusal" }),
    ],
    [
      "the output is cut off",
      () => parse.mockResolvedValue({ ...good, stop_reason: "max_tokens" }),
    ],
    [
      "the output does not validate",
      () => parse.mockResolvedValue({ ...good, parsed_output: null }),
    ],
  ])("gives the use back when %s", async (_, arrange) => {
    arrange();
    expect(await call()).toEqual({ status: "error", message: "failed" });
    expect(names()).toContain("ai_release");
    expect(names().filter((n) => n === "ai_release")).toHaveLength(1);
  });
});
