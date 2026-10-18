import { notFound } from "next/navigation";

// This route only ever renders the 404 page, so instant-navigation validation does not apply.
export const instant = false;

/** Any unknown path inside a locale shows the localized 404 page. */
export default function CatchAll() {
  notFound();
}
