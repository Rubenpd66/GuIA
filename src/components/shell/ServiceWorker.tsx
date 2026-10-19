"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

/**
 * Registers the offline service worker in production and offers a reload when a new version
 * takes over an open tab (pages already load fresh from the network when online).
 */
export function ServiceWorker() {
  const t = useTranslations("Pwa");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    const container = navigator.serviceWorker;
    const hadController = Boolean(container.controller);
    const onChange = () => {
      if (hadController) setUpdated(true);
    };
    container.addEventListener("controllerchange", onChange);
    container.register("/sw.js").catch(() => {
      // No offline mode (private window, blocked); the site works the same online.
    });
    return () => container.removeEventListener("controllerchange", onChange);
  }, []);

  if (!updated) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-md flex-wrap items-center gap-3 rounded-page border-[1.5px] border-line bg-paper p-4"
    >
      <p className="flex-1">{t("updated")}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        {t("reload")}
      </Button>
    </div>
  );
}
