import type { Page } from "@playwright/test";

/** A microphone made from an oscillator, so the real MediaRecorder has something to record. */
export async function fakeMicrophone(page: Page) {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const destination = context.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      return destination.stream;
    };
  });
}

/** A few attempts and mistakes, so the dashboard and mistakes bank have something to show. */
export async function seedProgress(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("sello:progress")) return;
    const now = Date.now();
    const attempt = (
      part: string,
      correct: number,
      total: number,
      daysAgo: number,
      mode = "exam",
    ) => ({
      id: `${part}-${daysAgo}`,
      part,
      mode,
      startedAt: now - daysAgo * 86_400_000 - 600_000,
      finishedAt: now - daysAgo * 86_400_000,
      correct,
      total,
    });
    localStorage.setItem(
      "sello:progress",
      JSON.stringify({
        version: 1,
        attempts: [
          attempt("core-grammar", 22, 25, 0),
          attempt("reading-2", 4, 5, 1),
          attempt("listening-1", 2, 5, 2),
          attempt("writing-2", 3, 4, 0),
        ],
        mistakes: {
          "cg-x": { part: "core-grammar", count: 1, streak: 0, lastSeen: now },
          "r2#1": { part: "reading-2", count: 2, streak: 1, lastSeen: now },
        },
      }),
    );
  });
}
