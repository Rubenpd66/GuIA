"use client";

import { useTranslations } from "next-intl";
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { Icon } from "@/components/icons/Icon";
import { cx } from "@/lib/cx";

type SortableListProps = {
  /** Items in their original order; `order[position]` is the index of the item shown there. */
  items: { id: string; content: ReactNode }[];
  order: readonly number[];
  /** How many positions at the top are fixed (they cannot move or be moved into). */
  fixed: number;
  onMove: (from: number, to: number) => void;
  disabled?: boolean;
  /** Extra content after a row, such as right/wrong marks in study mode. */
  renderAfter?: (position: number) => ReactNode;
};

type Picked = { from: number; current: number; via: "keyboard" | "pointer" };

const MOVE_BUTTON =
  "inline-flex size-11 items-center justify-center rounded-control border-[1.5px] border-line text-ink transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--paper)_88%,var(--ink))] disabled:cursor-not-allowed disabled:opacity-40";

/**
 * A list to put in order by dragging a handle (mouse or touch), with the keyboard
 * (Space to pick up, arrows to move, Space to drop, Escape to cancel) or with up/down buttons.
 * Every move is announced to screen readers.
 */
export function SortableList({
  items,
  order,
  fixed,
  onMove,
  disabled = false,
  renderAfter,
}: SortableListProps) {
  const t = useTranslations("Reading.sortable");
  const [picked, setPickedState] = useState<Picked | null>(null);
  // Pointer moves can arrive faster than React re-renders, so they read the ref, not the state.
  const pickedRef = useRef<Picked | null>(null);
  const setPicked = (next: Picked | null) => {
    pickedRef.current = next;
    setPickedState(next);
  };
  const [announcement, setAnnouncement] = useState("");
  const rows = useRef(new Map<number, HTMLLIElement>());
  const instructionsId = useId();
  const total = order.length;
  const last = total - 1;

  const move = (from: number, to: number) => {
    if (to < fixed || to > last || from === to) return from;
    onMove(from, to);
    return to;
  };

  const announce = (key: "picked" | "moved" | "dropped", position: number) =>
    setAnnouncement(t(key, { position: position + 1, total }));

  const onHandleKeyDown = (event: KeyboardEvent, position: number) => {
    if (disabled) return;
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (picked) {
        announce("dropped", picked.current);
        setPicked(null);
      } else {
        setPicked({ from: position, current: position, via: "keyboard" });
        announce("picked", position);
      }
      return;
    }
    if (!picked) return;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const target = picked.current + (event.key === "ArrowUp" ? -1 : 1);
      const current = move(picked.current, target);
      setPicked({ ...picked, current });
      announce("moved", current);
    } else if (event.key === "Escape") {
      event.preventDefault();
      move(picked.current, picked.from);
      setPicked(null);
      setAnnouncement(t("cancelled", { position: picked.from + 1, total }));
    }
  };

  const onPointerDown = (event: PointerEvent, position: number) => {
    if (disabled || event.button !== 0) return;
    setPicked({ from: position, current: position, via: "pointer" });
    announce("picked", position);
    // Listen on window: once the row moves in the DOM, touch events stop reaching the handle.
    const id = event.pointerId;
    const onWindowMove = (e: globalThis.PointerEvent) => {
      if (e.pointerId === id) onPointerMove(e);
    };
    const onWindowEnd = (e: globalThis.PointerEvent) => {
      if (e.pointerId !== id) return;
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowEnd);
      window.removeEventListener("pointercancel", onWindowEnd);
      onPointerEnd();
    };
    window.addEventListener("pointermove", onWindowMove);
    window.addEventListener("pointerup", onWindowEnd);
    window.addEventListener("pointercancel", onWindowEnd);
  };

  const onPointerMove = (event: { clientY: number }) => {
    const picked = pickedRef.current;
    if (!picked || picked.via !== "pointer") return;
    // The target is the row whose vertical middle the pointer has passed.
    let target = picked.current;
    for (let position = fixed; position <= last; position++) {
      const rect = rows.current.get(position)?.getBoundingClientRect();
      if (!rect) continue;
      const middle = rect.top + rect.height / 2;
      if (position < picked.current && event.clientY < middle) {
        target = position;
        break;
      }
      if (position > picked.current && event.clientY > middle)
        target = position;
    }
    if (target !== picked.current) {
      setPicked({ ...picked, current: move(picked.current, target) });
    }
  };

  const onPointerEnd = () => {
    const picked = pickedRef.current;
    if (!picked || picked.via !== "pointer") return;
    announce("dropped", picked.current);
    setPicked(null);
  };

  return (
    <div>
      <p id={instructionsId} className="sr-only">
        {t("instructions")}
      </p>
      <ol className="space-y-2">
        {order.map((itemIndex, position) => {
          const item = items[itemIndex]!;
          const isFixed = position < fixed;
          const isPicked = picked?.current === position;
          return (
            <li
              key={item.id}
              ref={(node) => {
                if (node) rows.current.set(position, node);
                else rows.current.delete(position);
              }}
              className={cx(
                "flex items-start gap-3 rounded-control border-[1.5px] bg-paper p-3 transition-shadow duration-150",
                isFixed ? "border-dashed border-hairline" : "border-line",
                isPicked &&
                  "relative z-10 border-cover shadow-lg ring-2 ring-cover dark:border-foil dark:ring-foil",
              )}
            >
              <span
                aria-hidden="true"
                className="mt-0.5 w-6 shrink-0 text-right font-bold text-ink-soft tabular-nums"
              >
                {position + 1}
              </span>
              <div lang="en" className="min-w-0 flex-1 self-center">
                {item.content}
                {renderAfter?.(position)}
              </div>
              {isFixed ? (
                <span className="self-center text-sm text-ink-soft">
                  {t("fixed")}
                </span>
              ) : (
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={disabled}
                    aria-label={t("handle", { position: position + 1, total })}
                    aria-describedby={instructionsId}
                    aria-pressed={isPicked && picked?.via === "keyboard"}
                    onKeyDown={(event) => onHandleKeyDown(event, position)}
                    onPointerDown={(event) => onPointerDown(event, position)}
                    onBlur={() => {
                      if (picked?.via === "keyboard") {
                        setPicked(null);
                        announce("dropped", picked.current);
                      }
                    }}
                    className={cx(
                      MOVE_BUTTON,
                      "cursor-grab touch-none active:cursor-grabbing",
                    )}
                  >
                    <Icon name="grip" className="size-5" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || position <= fixed}
                    aria-label={t("up", { position: position + 1 })}
                    onClick={() => {
                      const to = move(position, position - 1);
                      announce("moved", to);
                    }}
                    className={MOVE_BUTTON}
                  >
                    <Icon name="arrowUp" className="size-5" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || position >= last}
                    aria-label={t("down", { position: position + 1 })}
                    onClick={() => {
                      const to = move(position, position + 1);
                      announce("moved", to);
                    }}
                    className={MOVE_BUTTON}
                  >
                    <Icon name="arrowDown" className="size-5" />
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
