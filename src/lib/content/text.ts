const WORD = /[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu;
const GAP = /_{3,}/g;

/** Counts words the way an examiner would: contractions and hyphenated words count once. */
export function countWords(text: string): number {
  return text.match(WORD)?.length ?? 0;
}

/** Counts answer gaps written as three or more underscores. */
export function countGaps(text: string): number {
  return text.match(GAP)?.length ?? 0;
}

/** Removes the UTF-8 byte order mark that some Windows editors add. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

const BRITISH_OF: Record<string, string> = {
  color: "colour",
  colors: "colours",
  colored: "coloured",
  favorite: "favourite",
  favorites: "favourites",
  organize: "organise",
  organized: "organised",
  organizes: "organises",
  organizing: "organising",
  organization: "organisation",
  organizations: "organisations",
  realize: "realise",
  realized: "realised",
  realizes: "realises",
  realizing: "realising",
  recognize: "recognise",
  recognized: "recognised",
  recognizes: "recognises",
  recognizing: "recognising",
  apologize: "apologise",
  apologized: "apologised",
  apologizing: "apologising",
  analyze: "analyse",
  analyzed: "analysed",
  analyzing: "analysing",
  center: "centre",
  centers: "centres",
  theater: "theatre",
  theaters: "theatres",
  behavior: "behaviour",
  behaviors: "behaviours",
  neighbor: "neighbour",
  neighbors: "neighbours",
  neighborhood: "neighbourhood",
  honor: "honour",
  labor: "labour",
  humor: "humour",
  flavor: "flavour",
  traveled: "travelled",
  traveling: "travelling",
  traveler: "traveller",
  travelers: "travellers",
  canceled: "cancelled",
  canceling: "cancelling",
  gray: "grey",
  defense: "defence",
  offense: "offence",
  catalog: "catalogue",
  fulfill: "fulfil",
  enroll: "enrol",
  jewelry: "jewellery",
  mom: "mum",
  skeptical: "sceptical",
  aluminum: "aluminium",
  airplane: "aeroplane",
};

export type AmericanSpelling = { word: string; british: string; index: number };

/** Finds American spellings so content stays in British English, like the exam. */
export function findAmericanSpellings(text: string): AmericanSpelling[] {
  const found: AmericanSpelling[] = [];
  for (const match of text.matchAll(/\p{L}+/gu)) {
    const word = match[0];
    const british = BRITISH_OF[word.toLowerCase()];
    if (british === undefined) continue;
    const suggestion =
      word[0] === word[0]?.toUpperCase()
        ? british[0]?.toUpperCase() + british.slice(1)
        : british;
    found.push({ word, british: suggestion, index: match.index });
  }
  return found;
}
