import { describe, expect, it } from "vitest";
import { pickVoices, planUtterances, type VoiceInfo } from "./plan";

const voice = (name: string, lang = "en-GB"): VoiceInfo => ({
  name,
  lang,
  voiceURI: name,
});

describe("planUtterances", () => {
  it("splits turns into sentences and keeps the speaker", () => {
    const plan = planUtterances([
      { speaker: "man", text: "Hello there. How are you?" },
      { speaker: "woman", text: "Fine, thanks." },
    ]);
    expect(plan).toEqual([
      { speaker: "man", text: "Hello there." },
      { speaker: "man", text: "How are you?" },
      { speaker: "woman", text: "Fine, thanks." },
    ]);
  });

  it("breaks a very long sentence at commas so no utterance is too long", () => {
    const clause = "and then we walked along the old river for a while";
    const text = Array(8).fill(clause).join(", ") + ".";
    const plan = planUtterances([{ speaker: "narrator", text }]);
    expect(plan.length).toBeGreaterThan(1);
    expect(plan.every((u) => u.text.length <= 200)).toBe(true);
    expect(plan.map((u) => u.text).join(" ")).toBe(text);
  });
});

describe("pickVoices", () => {
  it("prefers British voices and matches gender by name", () => {
    const { man, woman } = pickVoices([
      voice("Samantha", "en-US"),
      voice("Hazel"),
      voice("George"),
    ]);
    expect(man).toEqual({ voiceURI: "George", pitch: 1 });
    expect(woman).toEqual({ voiceURI: "Hazel", pitch: 1 });
  });

  it("honours the learner's choice when the voice exists, ignores it when not", () => {
    const voices = [voice("Hazel"), voice("George"), voice("Susan")];
    expect(pickVoices(voices, { woman: "Susan" }).woman.voiceURI).toBe("Susan");
    expect(pickVoices(voices, { woman: "Gone" }).woman.voiceURI).toBe("Hazel");
  });

  it("uses one voice at two pitches when only one voice exists", () => {
    const { man, woman } = pickVoices([voice("Hazel")]);
    expect(man.voiceURI).toBe("Hazel");
    expect(woman.voiceURI).toBe("Hazel");
    expect(man.pitch).toBeLessThan(woman.pitch);
  });

  it("falls back to the browser default when there are no English voices", () => {
    const { man, woman } = pickVoices([voice("Paulina", "es-MX")]);
    expect(man.voiceURI).toBeUndefined();
    expect(woman.voiceURI).toBeUndefined();
    expect(man.pitch).toBeLessThan(woman.pitch);
  });

  it("gives two unnamed English voices different voices without pitch changes", () => {
    const { man, woman } = pickVoices([voice("Voice A"), voice("Voice B")]);
    expect(man.voiceURI).not.toBe(woman.voiceURI);
  });
});
