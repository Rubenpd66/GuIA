import { readFileSync } from "node:fs";
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
});
