import type { Script, Speaker } from "@/lib/content/schemas/listening";
import { splitSentences } from "@/lib/content/text";

/** Chrome cuts a single utterance off after about 15 seconds, so keep each one short. */
const MAX_CHARS = 200;

export type Utterance = { text: string; speaker: Speaker };

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX_CHARS) return [sentence];
  const parts: string[] = [];
  let current = "";
  for (const piece of sentence.split(/(?<=,)\s+/)) {
    if (current && current.length + piece.length + 1 > MAX_CHARS) {
      parts.push(current);
      current = piece;
    } else {
      current = current ? `${current} ${piece}` : piece;
    }
  }
  if (current) parts.push(current);
  return parts;
}

/** A script as short utterances, one sentence (or comma-separated chunk) at a time. */
export function planUtterances(script: Script): Utterance[] {
  return script.flatMap(({ speaker, text }) =>
    splitSentences(text)
      .flatMap(splitLong)
      .map((chunk) => ({ text: chunk, speaker })),
  );
}

export type VoiceInfo = { name: string; lang: string; voiceURI: string };
/** A voice to speak with; `voiceURI` is undefined for the browser's default. */
export type VoiceChoice = { voiceURI: string | undefined; pitch: number };
export type VoicePrefs = { man?: string; woman?: string };

// Browsers do not expose a voice's gender, so common voice names stand in for it.
const MALE =
  /\b(daniel|george|ryan|thomas|oliver|arthur|james|david|mark|guy|alex|fred|rishi|male)\b/i;
const FEMALE =
  /\b(hazel|susan|sonia|libby|maisie|serena|kate|samantha|karen|moira|fiona|zira|victoria|female)\b/i;

const MAN_PITCH = 0.8;
const WOMAN_PITCH = 1.1;

/**
 * Voices for the man and the woman (the narrator uses the woman's): the learner's choice if
 * it still exists, else a British English voice matched by name, else one voice at two pitches.
 */
export function pickVoices(
  voices: readonly VoiceInfo[],
  prefs: VoicePrefs = {},
): { man: VoiceChoice; woman: VoiceChoice } {
  const english = voices
    .filter((voice) => /^en([-_]|$)/i.test(voice.lang))
    .sort(
      (a, b) =>
        Number(/^en[-_]GB$/i.test(b.lang)) - Number(/^en[-_]GB$/i.test(a.lang)),
    );
  const byURI = (uri?: string) => english.find((v) => v.voiceURI === uri);
  const named = (uri: string | undefined, name: RegExp, not?: VoiceInfo) =>
    byURI(uri) ?? english.find((v) => name.test(v.name) && v !== not);
  let man = named(prefs.man, MALE);
  let woman = named(prefs.woman, FEMALE, man);
  man ??= english.find((v) => v !== woman && !FEMALE.test(v.name));
  woman ??= english.find((v) => v !== man && !MALE.test(v.name));
  const shared = !man || !woman;
  const fallback = man ?? woman ?? english[0];
  return {
    man: man
      ? { voiceURI: man.voiceURI, pitch: 1 }
      : { voiceURI: fallback?.voiceURI, pitch: shared ? MAN_PITCH : 1 },
    woman: woman
      ? { voiceURI: woman.voiceURI, pitch: 1 }
      : { voiceURI: fallback?.voiceURI, pitch: shared ? WOMAN_PITCH : 1 },
  };
}
