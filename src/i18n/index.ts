import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enUS from 'antd/locale/en_US'
import frFR from 'antd/locale/fr_FR'
import { en } from './locales/en'
import { fr } from './locales/fr'

type AntdLocale = typeof enUS

export const SUPPORTED_LNGS = ['en', 'fr'] as const

// Default to the browser UI language, fall back to English.
void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LNGS as unknown as string[],
    load: 'languageOnly', // fr-FR / fr-CA → fr
    detection: {
      // Only the browser language matters in an extension context.
      order: ['navigator'],
      caches: [],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })

/** Language detected from the browser at init — used for the "automatic" option. */
export const BROWSER_LNG = i18n.language

const ANTD_LOCALES: Record<string, AntdLocale> = { en: enUS, fr: frFR }

/** Ant Design locale matching the active i18next language. */
export function antdLocale(language: string): AntdLocale {
  return ANTD_LOCALES[language.split('-')[0]] ?? enUS
}

export default i18n
