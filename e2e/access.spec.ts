import { readFileSync, readdirSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { expect, test } from "@playwright/test";

/** A file under content/, parsed, so the tests follow the content instead of copying it. */
const content = <T>(path: string): T =>
  JSON.parse(readFileSync(`content/${path}`, "utf8")) as T;

type LessonFile = { items: { mistakes: { wrong: string }[] }[] };
const firstMistake = (slug: string) =>
  content<LessonFile>(`grammar/${slug}.json`).items[0]!.mistakes[0]!.wrong;

// Visitors have the free tier. The whole response is checked, HTML and inline RSC data alike,
// because paid text must not reach the browser at all, not just stay off the screen.
test.describe("visitors", () => {
  test("a B1 lesson ships its summary but not its body", async ({
    request,
  }) => {
    const body = await (
      await request.get("/es/gramatica/present-simple-vs-continuous")
    ).text();
    expect(
      body.includes(firstMistake("present-simple-vs-continuous")),
      "paid text in the response",
    ).toBe(false);
    expect(body.includes("data-paywall"), "expected text missing").toBe(true);
  });

  test("an A2 lesson is complete", async ({ request }) => {
    const body = await (await request.get("/es/gramatica/there-and-it")).text();
    expect(
      body.includes(firstMistake("there-and-it")),
      "expected text missing",
    ).toBe(true);
    expect(
      body.includes("data-paywall"),
      "an A2 lesson must not be locked",
    ).toBe(false);
  });

  test("a vocabulary group hides definitions above A2", async ({ request }) => {
    type Entries = { items: { id: string; definition: string }[] };
    const paid = content<Entries>("vocabulary/travel.json").items.find(
      (entry) => entry.id === "itinerary",
    )!.definition;
    const free = content<Entries>("vocabulary/a2-everyday.json").items.find(
      (entry) => entry.id === "v-a2-passport",
    )!.definition;
    const body = await (await request.get("/es/vocabulario/travel")).text();
    expect(body.includes(paid), "paid text in the response").toBe(false);
    expect(body.includes(free), "expected text missing").toBe(true);
  });

  test("functional language shows A2 phrases and hides the rest", async ({
    request,
  }) => {
    type Phrases = { items: { id: string; example: string }[] };
    const items = content<Phrases>("functional/opinion.json").items;
    const example = (id: string) => items.find((p) => p.id === id)!.example;
    const body = await (await request.get("/es/lenguaje-funcional")).text();
    expect(
      body.includes(example("fl-opinion-01")),
      "paid text in the response",
    ).toBe(false);
    expect(
      body.includes(example("fl-opinion-a2-1")),
      "expected text missing",
    ).toBe(true);
  });

  test("the Core Grammar trainer holds only free questions", async ({
    request,
  }) => {
    type Questions = {
      items: { id: string; cefrLevel: string; placement?: true }[];
    };
    const all = readdirSync("content/exercises/core-grammar").flatMap(
      (file) => content<Questions>(`exercises/core-grammar/${file}`).items,
    );
    const free = all.find((q) => q.cefrLevel === "A2")!.id;
    const paid = all.find((q) => q.cefrLevel === "C1" && !q.placement)!.id;
    const body = await (await request.get("/es/practica/core-grammar")).text();
    expect(body.includes(paid), "paid question in the response").toBe(false);
    expect(body.includes(free), "expected question missing").toBe(true);
  });

  test("the mock bank has no paid tasks and is private", async ({
    request,
  }) => {
    const response = await request.get("/banks/mock");
    expect(response.headers()["cache-control"]).toContain("private");
    type Task = { id: string; cefrLevel: string; placement?: true };
    const bank = (await response.json()) as Record<string, Task[]>;
    const paid = Object.values(bank)
      .flat()
      .filter((task) => task.cefrLevel !== "A2" && !task.placement)
      .map((task) => task.id);
    expect(paid).toEqual([]);
    expect(bank.grammar!.length).toBeGreaterThan(0);
  });
});

// A signed-in B1 learner, with a throwaway user and subscription row in the test project
// (sello-dev) written with the secret key. Without these variables it is skipped.
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET = process.env.SUPABASE_SECRET_KEY;

test.describe("a B1 subscriber", () => {
  test.skip(!URL || !SECRET, "needs SUPABASE_SECRET_KEY for the test project");

  test("reads B1 lessons and meets the lock on B2", async ({ page }) => {
    const admin = createClient(URL!, SECRET!, {
      auth: { persistSession: false },
    });
    const email = `e2e-tier-${Date.now()}@example.com`;
    const password = "e2e-password-123";
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    expect(error).toBeNull();
    const userId = data.user!.id;

    try {
      const { error: rowError } = await admin.from("subscriptions").insert({
        user_id: userId,
        tier: "b1",
        interval: "month",
        status: "active",
        current_period_end: new Date(
          Date.now() + 30 * 86_400_000,
        ).toISOString(),
      });
      expect(rowError).toBeNull();

      await page.goto("/es/acceso");
      await page.locator("#in-email").fill(email);
      await page.locator("#in-password").fill(password);
      await page
        .getByRole("button", { name: "Entrar", exact: true })
        .first()
        .click();
      await expect(page).toHaveURL(/\/es\/cuenta/);

      await page.goto("/es/gramatica/present-simple-vs-continuous");
      await expect(
        page.getByText(firstMistake("present-simple-vs-continuous")),
      ).toBeVisible();
      await expect(page.locator("[data-paywall]")).toHaveCount(0);

      await page.goto("/es/gramatica/adjective-patterns-and-perception-verbs");
      await expect(page.locator("[data-paywall]")).toBeVisible();
      await expect(
        page.getByText(firstMistake("adjective-patterns-and-perception-verbs")),
      ).toHaveCount(0);

      // Banks and trainers: B1 and below, plus the public placement pool, and nothing else.
      type Task = { id: string; cefrLevel: string; placement?: true };
      const bank = (await (
        await page.request.get("/banks/mock")
      ).json()) as Record<string, Task[]>;
      const tooHigh = Object.values(bank)
        .flat()
        .filter(
          (task) => ["B2", "C1"].includes(task.cefrLevel) && !task.placement,
        );
      expect(tooHigh.map((task) => task.id)).toEqual([]);
      expect(
        Object.values(bank)
          .flat()
          .some((t) => t.cefrLevel === "B1"),
      ).toBe(true);

      const questions = readdirSync("content/exercises/core-grammar").flatMap(
        (file) =>
          content<{ items: Task[] }>(`exercises/core-grammar/${file}`).items,
      );
      const b1 = questions.find(
        (q) => q.cefrLevel === "B1" && !q.placement,
      )!.id;
      const b2 = questions.find(
        (q) => q.cefrLevel === "B2" && !q.placement,
      )!.id;
      const trainer = await (
        await page.request.get("/es/practica/core-grammar")
      ).text();
      expect(trainer.includes(b1), "B1 question missing").toBe(true);
      expect(trainer.includes(b2), "B2 question in the response").toBe(false);
    } finally {
      await admin.auth.admin.deleteUser(userId);
    }
  });
});
