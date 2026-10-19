import { Figtree } from "next/font/google";

/** The one typeface: interface, headings and long reading. "latin" already covers Spanish (á, é, ñ, ¿, ¡…). */
export const figtree = Figtree({
  subsets: ["latin"],
  // Upright only: the italic file is extra weight on every page; emphasis uses the synthesised italic.
  style: ["normal"],
  variable: "--font-figtree",
  display: "swap",
});
