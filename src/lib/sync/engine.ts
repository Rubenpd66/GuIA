"use client";

import { flashcardsStore, parseFlashcards } from "@/lib/flashcards/store";
import { mockStore } from "@/lib/mock/store";
import { MockState } from "@/lib/mock/state";
import { examDateStore, parseExamDate } from "@/lib/progress/examDate";
import { parseProgress } from "@/lib/progress/progress";
import {
  clearProgress,
  readProgress,
  saveProgress,
  subscribeProgress,
} from "@/lib/progress/useProgress";
import { parseJson } from "@/lib/storage/localStore";
import { DRAFTS_KEY } from "@/lib/writing/drafts";
import { supabaseBrowser } from "@/lib/supabase/client";
import { onUserChange } from "@/lib/auth/useUser";
import {
  mergeFlashcards,
  mergeLatest,
  mergeProgress,
  type Versioned,
} from "./merge";
import { clearCachedPages } from "@/lib/access/offline";
import { claimOwner } from "./owner";
import { setSyncStatus } from "./status";

type Channel<T> = {
  key: "progress" | "flashcards" | "exam-date" | "mock";
  read: () => T;
  write: (value: T) => void;
  subscribe: (onChange: () => void) => () => void;
  parse: (raw: string) => T;
  merge: (local: Versioned<T>, remote: Versioned<T>) => T;
};

/** Erases the value type, so one list can hold every store. */
const channel = <T>(c: Channel<T>) => c as unknown as Channel<unknown>;

const channels = [
  channel({
    key: "progress",
    read: readProgress,
    write: (value) => saveProgress(value, { quiet: true }),
    subscribe: subscribeProgress,
    parse: parseProgress,
    merge: (local, remote) => mergeProgress(local.value, remote.value),
  }),
  channel({
    key: "flashcards",
    read: flashcardsStore.read,
    write: flashcardsStore.save,
    subscribe: flashcardsStore.subscribe,
    parse: parseFlashcards,
    merge: mergeFlashcards,
  }),
  channel({
    key: "exam-date",
    read: examDateStore.read,
    write: examDateStore.save,
    subscribe: examDateStore.subscribe,
    parse: parseExamDate,
    merge: mergeLatest,
  }),
  channel({
    key: "mock",
    read: mockStore.read,
    write: mockStore.save,
    subscribe: mockStore.subscribe,
    parse: (raw) => {
      const result = MockState.safeParse(parseJson(raw));
      return result.success ? result.data : null;
    },
    merge: mergeLatest,
  }),
];

const META_KEY = "sello:sync-meta";
const PUSH_DELAY_MS = 2000;

/** When each store was last changed on this device (ms), to break ties with the cloud copy. */
function readMeta(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(META_KEY) ?? "{}");
  } catch {
    return {};
  }
}
function touchMeta(key: string, at: number) {
  try {
    localStorage.setItem(
      META_KEY,
      JSON.stringify({ ...readMeta(), [key]: at }),
    );
  } catch {
    // Blocked storage: the cloud copy simply wins the next tie.
  }
}

/** Removes the study data this browser holds (after deleting the account or a switch). */
export function clearLocalStudyData() {
  clearProgress();
  flashcardsStore.save(null);
  examDateStore.save(null);
  mockStore.save(null);
  try {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(DRAFTS_KEY);
  } catch {
    // Nothing to clear.
  }
}

async function run(userId: string, applying: { current: boolean }) {
  const supabase = supabaseBrowser();
  const { data, error } = await supabase
    .from("user_data")
    .select("key, value, updated_at");
  if (error) throw error;
  const remoteByKey = new Map(data.map((row) => [row.key as string, row]));
  const meta = readMeta();
  const rows: {
    user_id: string;
    key: string;
    value: unknown;
    updated_at: number;
  }[] = [];

  for (const channel of channels) {
    const local = { value: channel.read(), updatedAt: meta[channel.key] ?? 0 };
    const row = remoteByKey.get(channel.key);
    let merged = local.value;
    let updatedAt = local.updatedAt;
    if (row) {
      const remote = {
        value: channel.parse(JSON.stringify(row.value.data)),
        updatedAt: Number(row.updated_at),
      };
      merged = channel.merge(local, remote);
      updatedAt = Math.max(local.updatedAt, remote.updatedAt);
      if (JSON.stringify(merged) !== JSON.stringify(local.value)) {
        applying.current = true;
        channel.write(merged);
        applying.current = false;
      }
      if (JSON.stringify(merged) === JSON.stringify(remote.value)) continue;
      updatedAt = Date.now();
    } else {
      updatedAt = updatedAt || Date.now();
    }
    touchMeta(channel.key, updatedAt);
    rows.push({
      user_id: userId,
      key: channel.key,
      // Wrapped because JSON null would reach Postgres as SQL NULL, which the column refuses.
      value: { data: merged },
      updated_at: updatedAt,
    });
  }
  if (rows.length) {
    const { error: pushError } = await supabase
      .from("user_data")
      .upsert(rows, { onConflict: "user_id,key" });
    if (pushError) throw pushError;
  }
}

/** Keeps this device and the cloud in step while someone is signed in. Starts itself once. */
export function startSync() {
  let stop: (() => void) | undefined;
  return onUserChange((user) => {
    stop?.();
    stop = undefined;
    if (!user) return;
    // shortcut: changes the previous account made offline and never pushed are lost here,
    // accepted so a shared device cannot mix two learners' data.
    if (claimOwner(user.id)) {
      clearLocalStudyData();
      void clearCachedPages();
    }

    const applying = { current: false };
    let timer: ReturnType<typeof setTimeout> | undefined;
    let busy = false;
    const sync = async () => {
      if (busy) return;
      busy = true;
      setSyncStatus("syncing");
      try {
        await run(user.id, applying);
        setSyncStatus("synced");
      } catch (error) {
        console.warn("sello: sync failed", error);
        setSyncStatus("offline");
      } finally {
        busy = false;
      }
    };
    const unsubscribers = channels.map((channel) =>
      channel.subscribe(() => {
        if (applying.current) return;
        touchMeta(channel.key, Date.now());
        clearTimeout(timer);
        timer = setTimeout(sync, PUSH_DELAY_MS);
      }),
    );
    const onVisible = () => {
      if (document.visibilityState === "visible") void sync();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", sync);
    void sync();

    stop = () => {
      clearTimeout(timer);
      unsubscribers.forEach((off) => off());
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", sync);
    };
  });
}
