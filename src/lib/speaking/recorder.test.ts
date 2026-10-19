import { describe, expect, it, vi } from "vitest";
import {
  createRecorder,
  recordingExtension,
  type RecorderDeps,
} from "./recorder";

function fakes() {
  const tracks = [{ stop: vi.fn() }];
  const stream = { getTracks: () => tracks } as unknown as MediaStream;
  const recorders: {
    mimeType: string;
    state: string;
    ondataavailable: ((event: { data: Blob }) => void) | null;
    onstop: (() => void) | null;
    start: () => void;
    stop: () => void;
  }[] = [];
  let urls = 0;
  const deps = {
    getUserMedia: vi.fn(async () => stream),
    createRecorder: vi.fn(() => {
      const recorder = {
        mimeType: "audio/webm",
        state: "inactive",
        ondataavailable: null as ((event: { data: Blob }) => void) | null,
        onstop: null as (() => void) | null,
        start() {
          recorder.state = "recording";
        },
        stop() {
          recorder.state = "inactive";
          recorder.ondataavailable?.({ data: new Blob(["sound"]) });
          recorder.onstop?.();
        },
      };
      recorders.push(recorder);
      return recorder;
    }),
    createURL: vi.fn(() => `blob:${++urls}`),
    revokeURL: vi.fn(),
  } satisfies RecorderDeps;
  return { deps, tracks, recorders };
}

describe("createRecorder", () => {
  it("records, stops and exposes an object URL", async () => {
    const { deps } = fakes();
    const recorder = createRecorder(deps);
    await recorder.start();
    expect(recorder.getState().status).toBe("recording");
    recorder.stop();
    expect(recorder.getState()).toEqual({
      status: "stopped",
      url: "blob:1",
      mimeType: "audio/webm",
    });
  });

  it("asks for the microphone once and revokes the old URL when recording again", async () => {
    const { deps } = fakes();
    const recorder = createRecorder(deps);
    await recorder.start();
    recorder.stop();
    await recorder.start();
    expect(deps.revokeURL).toHaveBeenCalledWith("blob:1");
    recorder.stop();
    expect(recorder.getState().url).toBe("blob:2");
    expect(deps.getUserMedia).toHaveBeenCalledTimes(1);
  });

  it("reports a refused permission as denied and other failures as unavailable", async () => {
    const denied = fakes().deps;
    denied.getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error("no"), { name: "NotAllowedError" }),
    );
    const a = createRecorder(denied);
    await a.start();
    expect(a.getState().status).toBe("denied");

    const missing = fakes().deps;
    missing.getUserMedia.mockRejectedValueOnce(
      Object.assign(new Error("none"), { name: "NotFoundError" }),
    );
    const b = createRecorder(missing);
    await b.start();
    expect(b.getState().status).toBe("unavailable");

    const c = createRecorder({ ...fakes().deps, getUserMedia: undefined });
    await c.start();
    expect(c.getState().status).toBe("unavailable");
  });

  it("frees the microphone and the URL on release, even mid-recording", async () => {
    const { deps, tracks } = fakes();
    const recorder = createRecorder(deps);
    await recorder.start();
    recorder.stop();
    await recorder.start();
    recorder.release();
    expect(tracks[0]!.stop).toHaveBeenCalled();
    expect(recorder.getState()).toEqual({
      status: "idle",
      url: null,
      mimeType: "",
    });
    // The recording cut short by release() never produces a URL to leak.
    expect(deps.createURL).toHaveBeenCalledTimes(1);
    expect(deps.revokeURL).toHaveBeenCalledWith("blob:1");
  });

  it("drops a microphone granted after the session was left", async () => {
    const { deps, tracks } = fakes();
    const recorder = createRecorder(deps);
    const pending = recorder.start();
    recorder.release();
    await pending;
    expect(tracks[0]!.stop).toHaveBeenCalled();
    expect(deps.createRecorder).not.toHaveBeenCalled();
    expect(recorder.getState().status).toBe("idle");
  });

  it("notifies subscribers of every change", async () => {
    const { deps } = fakes();
    const recorder = createRecorder(deps);
    const seen: string[] = [];
    recorder.subscribe(() => seen.push(recorder.getState().status));
    await recorder.start();
    recorder.stop();
    recorder.reset();
    expect(seen).toEqual(["requesting", "recording", "stopped", "idle"]);
  });
});

describe("recordingExtension", () => {
  it("names the file after the recorded format", () => {
    expect(recordingExtension("audio/webm;codecs=opus")).toBe("webm");
    expect(recordingExtension("audio/ogg")).toBe("ogg");
    expect(recordingExtension("audio/mp4")).toBe("m4a");
  });
});
