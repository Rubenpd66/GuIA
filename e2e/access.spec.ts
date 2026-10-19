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
});
