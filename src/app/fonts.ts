import { Archivo, Literata } from "next/font/google";

/** Interface, headings and stamps. The width axis gives the expanded "official document" cut. */
// "latin" already covers Spanish (á, é, ñ, ¿, ¡…); latin-ext only added weight to every page.
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Long reading: lessons, Reading texts, model answers and exercise prompts. */
export const literata = Literata({
  subsets: ["latin"],
  // No optical-size axis: it doubled the file size for a difference hard to see on screen.
  // Upright only: the italic file cost about 50 KB on every lesson (~9 Lighthouse points on
  // mobile); emphasis in examples uses the browser's synthesised italic instead.
  style: ["normal"],
  variable: "--font-literata",
  // Not on every page's critical path. If it is not there in time, the fallback stays for this
  // page view instead of reflowing long texts (layout shift); later views have it cached.
  display: "optional",
  preload: false,
});
