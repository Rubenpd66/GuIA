import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { SiteFooter } from "./SiteFooter";
import { SpineNav } from "./SpineNav";
import { TopBar } from "./TopBar";

/** Spine on the left from 1024px; top bar and bottom tabs below that. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
      <SpineNav />
      <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 py-8 outline-none sm:px-6 lg:px-12 lg:py-14"
        >
          <div className="max-w-5xl">{children}</div>
        </main>
        <SiteFooter />
      </div>
      <BottomNav />
    </div>
  );
}
