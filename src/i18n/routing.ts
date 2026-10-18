import { defineRouting } from "next-intl/routing";

/**
 * Internal paths are English; each locale gets its own public path (spec §7).
 * Lesson slugs stay in English in both locales: /es/gramatica/inversion.
 */
export const routing = defineRouting({
  locales: ["es", "en"],
  defaultLocale: "es",
  localePrefix: "always",
  // The locale always lives in the URL, so no cookie is needed.
  localeCookie: false,
  pathnames: {
    "/": "/",
    "/dashboard": { es: "/panel", en: "/dashboard" },
    "/placement-test": { es: "/test-de-nivel", en: "/placement-test" },
    "/syllabus": { es: "/temario", en: "/syllabus" },
    "/grammar": { es: "/gramatica", en: "/grammar" },
    "/grammar/[slug]": { es: "/gramatica/[slug]", en: "/grammar/[slug]" },
    "/vocabulary": { es: "/vocabulario", en: "/vocabulary" },
    "/vocabulary/[slug]": {
      es: "/vocabulario/[slug]",
      en: "/vocabulary/[slug]",
    },
    "/reading": { es: "/lectura", en: "/reading" },
    "/listening": { es: "/comprension-auditiva", en: "/listening" },
    "/writing": { es: "/expresion-escrita", en: "/writing" },
    "/speaking": { es: "/expresion-oral", en: "/speaking" },
    "/practice": { es: "/practica", en: "/practice" },
    "/practice/[part]": { es: "/practica/[part]", en: "/practice/[part]" },
    "/mock-exam": { es: "/simulacro", en: "/mock-exam" },
    "/flashcards": "/flashcards",
    "/mistakes": { es: "/errores", en: "/mistakes" },
    "/exam-guide": { es: "/guia", en: "/exam-guide" },
    "/settings": { es: "/ajustes", en: "/settings" },
    "/legal-notice": { es: "/aviso-legal", en: "/legal-notice" },
    "/privacy": { es: "/privacidad", en: "/privacy" },
    "/design": "/design",
  },
});

export type Locale = (typeof routing.locales)[number];
export type Pathname = keyof typeof routing.pathnames;
/** Pathnames without dynamic segments, usable as plain link targets. */
export type StaticPathname = Exclude<Pathname, `${string}[${string}]${string}`>;
