import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import tr from './locales/tr.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const mapToSupported = (code: string): SupportedLanguage => {
  if (code.startsWith('tr')) return 'tr';
  if (code.startsWith('ru')) return 'ru';
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: mapToSupported(deviceLocale),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export function setLanguage(lng: SupportedLanguage) {
  i18n.changeLanguage(lng);
}

export function getCurrentLanguage(): SupportedLanguage {
  const current = i18n.language;
  if (SUPPORTED_LANGUAGES.includes(current as SupportedLanguage)) {
    return current as SupportedLanguage;
  }
  return 'en';
}

export default i18n;
