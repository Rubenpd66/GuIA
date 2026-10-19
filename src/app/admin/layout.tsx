import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { archivo } from "../fonts";
import "../globals.css";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/** Outside the localised app: no translation, no navigation, never indexed. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={archivo.variable}>
      <body className="antialiased">
        <main className="mx-auto max-w-5xl px-4 py-10">
          <Suspense>{children}</Suspense>
        </main>
      </body>
    </html>
  );
}
