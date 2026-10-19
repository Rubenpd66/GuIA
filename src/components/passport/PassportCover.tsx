import { SITE } from "@/config/site";
import { cx } from "@/lib/cx";
import { Guilloche } from "./Guilloche";

/**
 * The closed passport: burgundy like the Spanish one, with gold foil lettering.
 * Decorative, so the page heading carries the real text.
 */
export function PassportCover({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cx(
        "relative isolate flex aspect-[5/7] w-60 flex-col items-center justify-between overflow-hidden rounded-[14px] bg-accent px-4 py-8 text-on-accent sm:w-64 sm:px-6",
        "shadow-[inset_12px_0_0_-8px_color-mix(in_srgb,var(--accent)_60%,black)]",
        className,
      )}
    >
      <p className="text-center text-xs leading-relaxed font-semibold tracking-[0.12em] whitespace-nowrap sm:tracking-[0.18em]">
        PASAPORTE DE IDIOMAS
        <br />
        LANGUAGE PASSPORT
      </p>
      <Guilloche variant="rosette" className="w-36 opacity-75 sm:w-40" />
      <p className="text-2xl font-black tracking-[0.14em]">
        {SITE.name.toUpperCase()}
      </p>
    </div>
  );
}
