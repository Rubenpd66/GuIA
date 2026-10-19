import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { SITE } from "@/config/site";
import { routing, type Locale } from "@/i18n/routing";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${SITE.name}: Aptis ESOL General`;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/** The share card: the brand on white, in the light theme's colours (no third-party logos). */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "Metadata",
  });
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "#ffffff",
        color: "#14161c",
        borderLeft: "48px solid #1f5fe0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            border: "8px solid #1f5fe0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 40,
            fontWeight: 800,
            color: "#1f5fe0",
          }}
        >
          C
        </div>
        <div style={{ fontSize: 72, fontWeight: 800 }}>{SITE.name}</div>
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.15 }}>
        {t("title")}
      </div>
      <div style={{ fontSize: 30, color: "#4a5466" }}>{t("description")}</div>
    </div>,
    size,
  );
}
