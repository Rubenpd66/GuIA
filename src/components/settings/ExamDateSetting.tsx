"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { examDateStore } from "@/lib/progress/examDate";
import { LocalDay } from "@/lib/progress/schema";

/** The exam date drives the countdown and the mock-exam suggestion on the dashboard. */
export function ExamDateSetting() {
  const t = useTranslations("Settings");
  const examDate = examDateStore.useValue();
  return (
    <div className="space-y-3">
      <p className="text-ink-soft">{t("examDateLead")}</p>
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="exam-date" className="block font-semibold">
            {t("examDate")}
          </label>
          <input
            id="exam-date"
            type="date"
            value={examDate ?? ""}
            onChange={(event) => {
              const value = event.target.value;
              examDateStore.save(
                LocalDay.safeParse(value).success ? value : null,
              );
            }}
            className="mt-2 min-h-12 rounded-control border-[1.5px] border-line bg-paper px-3"
          />
        </div>
        {examDate ? (
          <Button variant="ghost" onClick={() => examDateStore.save(null)}>
            {t("examDateClear")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
