"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  browserRecorderDeps,
  createRecorder,
  type RecorderState,
} from "./recorder";

const SERVER_STATE: RecorderState = { status: "idle", url: null, mimeType: "" };

/** One recorder per mounted session; leaving the session frees the microphone and the audio. */
export function useRecorder() {
  const [recorder] = useState(() => createRecorder(browserRecorderDeps()));
  const state = useSyncExternalStore(
    recorder.subscribe,
    recorder.getState,
    () => SERVER_STATE,
  );
  useEffect(() => () => recorder.release(), [recorder]);
  return { ...state, recorder };
}
