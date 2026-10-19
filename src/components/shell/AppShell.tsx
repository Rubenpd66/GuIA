import { ViewTransition, type ReactNode } from "react";
import { LevelUpNotice } from "@/components/dashboard/LevelUpNotice";
import { BottomNav } from "./BottomNav";
import { SyncRunner } from "@/components/account/SyncRunner";
import { ServiceWorker } from "./ServiceWorker";
import { SiteFooter } from "./SiteFooter";
import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";

/** Side nav on the left from 1024px; top bar and bottom tabs below that. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
      <SideNav />
      <div className="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <TopBar />
        <main
          id="main"
          tabIndex={-1}
          className="flex-1 px-4 py-8 outline-none sm:px-6 lg:px-12 lg:py-14"
        >
          <ViewTransition default="page-swap">
            <div className="max-w-5xl">{children}</div>
          </ViewTransition>
        </main>
        <SiteFooter />
        <LevelUpNotice />
        <ServiceWorker />
        <SyncRunner />
      </div>
      <BottomNav />
    </div>
  );
}
