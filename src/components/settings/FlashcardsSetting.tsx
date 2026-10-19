"use client";

import { useTranslations } from "next-intl";
import { NEW_PER_DAY } from "@/lib/flashcards/deck";
import { flashcardsStore } from "@/lib/flashcards/store";

const CHOICES = [5, 10, 15, 20, 30, 50] as const;

export function FlashcardsSetting() {
  const t = useTranslations("Settings");
  const state = flashcardsStore.useValue();
  return (
    <div>
      <label htmlFor="new-per-day" className="block font-semibold">
        {t("newPerDay")}
      </label>
      <select
        id="new-per-day"
        value={state.newPerDay}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (value >= NEW_PER_DAY.min && value <= NEW_PER_DAY.max)
            flashcardsStore.save({
              ...flashcardsStore.read(),
              newPerDay: value,
            });
        }}
        className="mt-2 min-h-12 rounded-control border-[1.5px] border-line bg-paper px-3"
      >
        {CHOICES.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </div>
  );
}
