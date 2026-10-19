/**
 * Microphone recording with the browser's own MediaRecorder. The audio only ever lives in
 * memory as a Blob and its object URL: nothing is uploaded or stored.
 */

export type RecorderStatus =
  "idle" | "requesting" | "recording" | "stopped" | "unavailable" | "denied";

export type RecorderState = {
  status: RecorderStatus;
  url: string | null;
  mimeType: string;
};

type MinimalRecorder = {
  mimeType: string;
  state: string;
  ondataavailable: ((event: { data: Blob }) => void) | null;
  onstop: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export type RecorderDeps = {
  getUserMedia?: (constraints: { audio: true }) => Promise<MediaStream>;
  createRecorder?: (stream: MediaStream) => MinimalRecorder;
  createURL: (blob: Blob) => string;
  revokeURL: (url: string) => void;
};

export function browserRecorderDeps(): RecorderDeps {
  const supported =
    typeof navigator !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia) &&
    typeof MediaRecorder !== "undefined";
  return {
    getUserMedia: supported
      ? (constraints) => navigator.mediaDevices.getUserMedia(constraints)
      : undefined,
    createRecorder: supported
      ? (stream) => new MediaRecorder(stream) as unknown as MinimalRecorder
      : undefined,
    createURL: (blob) => URL.createObjectURL(blob),
    revokeURL: (url) => URL.revokeObjectURL(url),
  };
}

export function createRecorder(deps: RecorderDeps) {
  let state: RecorderState = { status: "idle", url: null, mimeType: "" };
  let stream: MediaStream | null = null;
  let recorder: MinimalRecorder | null = null;
  // Bumped by release(), so a permission prompt answered after leaving is ignored.
  let generation = 0;
  const listeners = new Set<() => void>();

  const set = (next: Partial<RecorderState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };
  const dropURL = () => {
    if (state.url) deps.revokeURL(state.url);
  };
  const stopTracks = () => {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  };

  async function start() {
    if (!deps.getUserMedia || !deps.createRecorder) {
      set({ status: "unavailable" });
      return;
    }
    if (state.status === "recording" || state.status === "requesting") return;
    const ticket = generation;
    if (!stream) {
      set({ status: "requesting" });
      try {
        const granted = await deps.getUserMedia({ audio: true });
        if (ticket !== generation) {
          granted.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = granted;
      } catch (error) {
        if (ticket !== generation) return;
        const denied =
          error instanceof Error &&
          (error.name === "NotAllowedError" || error.name === "SecurityError");
        set({ status: denied ? "denied" : "unavailable" });
        return;
      }
    }
    dropURL();
    const chunks: Blob[] = [];
    const current = deps.createRecorder(stream);
    recorder = current;
    current.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    current.onstop = () => {
      if (recorder !== current) return;
      recorder = null;
      const blob = new Blob(chunks, { type: current.mimeType });
      set({
        status: "stopped",
        url: deps.createURL(blob),
        mimeType: current.mimeType,
      });
    };
    current.start();
    set({ status: "recording", url: null });
  }

  function stop() {
    if (recorder?.state === "recording") recorder.stop();
  }

  /** Forgets the last recording (keeps the microphone for the next answer). */
  function reset() {
    dropURL();
    set({ status: "idle", url: null });
  }

  /** Stops everything and frees the microphone and the recording's memory. */
  function release() {
    generation++;
    const current = recorder;
    recorder = null;
    if (current?.state === "recording") current.stop();
    stopTracks();
    dropURL();
    set({ status: "idle", url: null, mimeType: "" });
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    start,
    stop,
    reset,
    release,
  };
}

export type Recorder = ReturnType<typeof createRecorder>;

/** File extension for a download, from the format the browser recorded in. */
export function recordingExtension(mimeType: string): string {
  if (mimeType.includes("ogg")) return "ogg";
  if (mimeType.includes("mp4")) return "m4a";
  return "webm";
}
