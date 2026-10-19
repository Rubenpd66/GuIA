"use client";

import { useEffect, useState } from "react";
import type { Banks } from "./banks";

// One request per bank and page view, shared by every component that asks for it.
const requests = new Map<keyof Banks, Promise<unknown>>();

/** Starts (or reuses) the request for a bank. */
export function loadBank<K extends keyof Banks>(name: K): Promise<Banks[K]> {
  let request = requests.get(name);
  if (!request) {
    request = fetch(`/banks/${name}`).then((response) => {
      if (!response.ok) throw new Error(`Bank ${name}: ${response.status}`);
      return response.json();
    });
    // A failed request can be tried again.
    request.catch(() => requests.delete(name));
    requests.set(name, request);
  }
  return request as Promise<Banks[K]>;
}

export type BankState<T> =
  | { status: "loading" }
  | { status: "ready"; data: T }
  | { status: "error"; retry: () => void };

/** A content bank from `/banks/<name>`, loaded once the page is on screen. */
export function useBank<K extends keyof Banks>(name: K): BankState<Banks[K]> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<BankState<Banks[K]>>({
    status: "loading",
  });
  useEffect(() => {
    let alive = true;
    loadBank(name).then(
      (data) => alive && setState({ status: "ready", data }),
      () =>
        alive &&
        setState({
          status: "error",
          retry: () => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          },
        }),
    );
    return () => {
      alive = false;
    };
  }, [name, attempt]);
  return state;
}
