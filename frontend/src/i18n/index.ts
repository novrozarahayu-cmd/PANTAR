import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import id from "./locales/id.json";
import en from "./locales/en.json";
import mdn from "./locales/mdn.json";

export const SUPPORTED_LANGUAGES = [
  { code: "id", label: "Bahasa Indonesia", short: "ID", flag: "🇮🇩" },
  { code: "en", label: "English", short: "EN", flag: "🇬🇧" },
  { code: "mdn", label: "Cakap Medan", short: "MDN", flag: "🟡" },
] as const;

export type SupportedLanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      id: { translation: id },
      en: { translation: en },
      mdn: { translation: mdn },
    },
    fallbackLng: "id",
    supportedLngs: ["id", "en", "mdn"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "pantaujalan_lng",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
