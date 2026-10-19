"use client";

import { useState, type CSSProperties } from "react";
import { OptionButton } from "@/components/trainer/OptionButton";
import { Button } from "./Button";
import { ProgressBar } from "./ProgressBar";

/** Design page sample: answer feedback, the stagger and the progress fill, replayable. */
export function MotionDemo({
  replay,
  options,
  progressLabel,
}: {
  replay: string;
  options: [string, string, string];
  progressLabel: string;
}) {
  const [run, setRun] = useState(0);
  return (
    <div key={run} className="space-y-6">
      <ul className="enter-stagger space-y-3">
        {(["idle", "correct", "wrong"] as const).map((state, i) => (
          <li key={state} style={{ "--i": i } as CSSProperties}>
            <OptionButton
              index={i}
              label={options[i] ?? ""}
              state={state}
              onSelect={() => undefined}
            />
          </li>
        ))}
      </ul>
      <ProgressBar value={0.64} label={progressLabel} />
      <Button onClick={() => setRun((n) => n + 1)}>{replay}</Button>
    </div>
  );
}
