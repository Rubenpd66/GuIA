"use client";

import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { flashcardsStore } from "@/lib/flashcards/store";
import { mockStore } from "@/lib/mock/store";
import { examDateStore } from "@/lib/progress/examDate";
import { exportProgress, importProgress } from "@/lib/progress/progress";
import {
  clearProgress,
  saveProgress,
  useProgress,
} from "@/lib/progress/useProgress";

type Message = { tone: "ok" | "error"; text: string };

const IMPORT_ERRORS = {
  "invalid-json": "importInvalidJson",
  "not-sello": "importNotSello",
  "invalid-data": "importInvalidData",
} as const;

/** Export, import and delete the progress stored in this browser. */
export function ProgressManager() {
  const t = useTranslations("Settings");
  const progress = useProgress();
  const [message, setMessage] = useState<Message | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const confirmDialog = useRef<HTMLDialogElement>(null);

  function download() {
    const extras = {
      examDate: examDateStore.read(),
      flashcards: flashcardsStore.read(),
      mock: mockStore.read(),
    };
    const blob = new Blob([exportProgress(progress, Date.now(), extras)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `guia-progress-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function upload(file: File) {
    const result = importProgress(await file.text());
    if (result.ok) {
      saveProgress(result.progress, { quiet: true });
      if ("examDate" in result.extras)
        examDateStore.save(result.extras.examDate ?? null);
      if (result.extras.flashcards)
        flashcardsStore.save(result.extras.flashcards);
      if ("mock" in result.extras) mockStore.save(result.extras.mock ?? null);
      setMessage({ tone: "ok", text: t("imported") });
    } else {
      setMessage({ tone: "error", text: t(IMPORT_ERRORS[result.error]) });
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">{t("progressLead")}</p>
      <ul className="space-y-1">
        <li>{t("sessions", { count: progress.attempts.length })}</li>
        <li>
          {t("pending", { count: Object.keys(progress.mistakes).length })}
        </li>
      </ul>
      <div className="flex flex-wrap gap-3">
        <Button onClick={download}>{t("export")}</Button>
        <Button onClick={() => fileInput.current?.click()}>
          {t("import")}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = "";
          }}
        />
        <Button
          variant="ghost"
          onClick={() => confirmDialog.current?.showModal()}
        >
          {t("reset")}
        </Button>
      </div>
      <p
        role="status"
        className={message?.tone === "error" ? "text-danger" : "text-success"}
      >
        {message?.text}
      </p>

      <dialog
        ref={confirmDialog}
        aria-labelledby="reset-title"
        className="m-auto max-w-md rounded-card bg-surface p-6 text-ink backdrop:bg-[color-mix(in_srgb,var(--ink)_45%,transparent)]"
      >
        <p id="reset-title" className="font-semibold">
          {t("resetConfirm")}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <Button onClick={() => confirmDialog.current?.close()} autoFocus>
            {t("cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              clearProgress();
              confirmDialog.current?.close();
              setMessage({ tone: "ok", text: t("resetDone") });
            }}
          >
            {t("resetButton")}
          </Button>
        </div>
      </dialog>
    </div>
  );
}
