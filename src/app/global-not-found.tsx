import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/config/site";
import { archivo } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: `404 | ${SITE.name}`,
  robots: { index: false },
};

/* This page skips the app layout, so it applies the saved theme itself. */
const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}`;

const LINK =
  "inline-flex min-h-12 items-center rounded-control bg-cover px-5 font-semibold text-on-cover";

/** For URLs outside both locales, so it speaks Spanish and English. */
export default function GlobalNotFound() {
  return (
    <html lang="es" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="antialiased">
        <main className="mx-auto flex min-h-dvh max-w-[60ch] flex-col justify-center gap-8 px-4 py-16">
          <section>
            <h1 className="text-2xl font-extrabold font-expanded">
              Esta página no existe
            </h1>
            <p className="mt-2 text-ink-soft">
              Puede que la dirección esté mal escrita.
            </p>
            <Link href="/es" className={`${LINK} mt-4`}>
              Ir al inicio
            </Link>
          </section>
          <section lang="en">
            <h2 className="text-2xl font-extrabold font-expanded">
              This page doesn’t exist
            </h2>
            <p className="mt-2 text-ink-soft">The address may be mistyped.</p>
            <Link href="/en" className={`${LINK} mt-4`}>
              Go to the home page
            </Link>
          </section>
        </main>
      </body>
    </html>
  );
}
