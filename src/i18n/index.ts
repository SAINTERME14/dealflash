import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";

/**
 * i18n bootstrap (FR/EN/ES/PT minimum).
 * Règle d'architecture : aucun texte en dur dans l'UI, tout via clés `t(...)`.
 * Les libellés produits/contenus dynamiques passent par la table `public.translations`.
 */
export const SUPPORTED_LOCALES = ["fr", "en", "es", "pt"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en },
      es: { translation: es },
      pt: { translation: pt },
    },
    fallbackLng: "fr",
    supportedLngs: SUPPORTED_LOCALES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "boardeal_locale",
    },
  });

export default i18n;
