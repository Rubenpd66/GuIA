import { describe, expect, it } from "vitest";
import { parseVoiceSettings } from "./settings";

describe("parseVoiceSettings", () => {
  it("falls back to normal speed for empty, broken or out-of-range values", () => {
    for (const raw of [null, "", "{", '{"rate":3}', '"x"'])
      expect(parseVoiceSettings(raw)).toEqual({ rate: 1 });
  });

  it("keeps a valid choice", () => {
    expect(parseVoiceSettings('{"rate":0.8,"man":"George"}')).toEqual({
      rate: 0.8,
      man: "George",
    });
  });
});
