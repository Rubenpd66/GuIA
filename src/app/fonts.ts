import { Archivo, Literata } from "next/font/google";

/** Interface, headings and stamps. The width axis gives the expanded "official document" cut. */
export const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Long reading: lessons, Reading texts, model answers and exercise prompts. */
export const literata = Literata({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  style: ["normal", "italic"],
  variable: "--font-literata",
  display: "swap",
});
