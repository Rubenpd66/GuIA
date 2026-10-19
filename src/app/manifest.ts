import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${SITE.name}: Aptis ESOL General (no oficial)`,
    short_name: SITE.name,
    description:
      "Preparación no oficial para el Aptis ESOL General: lecciones, práctica, test de nivel y simulacros.",
    lang: "es",
    start_url: "/es/panel",
    scope: "/",
    display: "standalone",
    background_color: "#eef2ef",
    theme_color: "#6b1f33",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
