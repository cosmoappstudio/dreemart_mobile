import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import ar from './locales/ar.json';
import de from './locales/de.json';
import el from './locales/el.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fi from './locales/fi.json';
import fr from './locales/fr.json';
import hi from './locales/hi.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import tr from './locales/tr.json';

export const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'ar',
  'de',
  'el',
  'es',
  'fi',
  'fr',
  'hi',
  'it',
  'ja',
  'ko',
  'nl',
  'pl',
  'pt',
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Dil seçicilerde gösterilen bayrak (emoji, bölgesel temsil) */
export const LANGUAGE_FLAG_EMOJI: Record<SupportedLanguage, string> = {
  tr: '🇹🇷',
  en: '🇬🇧',
  ru: '🇷🇺',
  ar: '🇸🇦',
  de: '🇩🇪',
  el: '🇬🇷',
  es: '🇪🇸',
  fi: '🇫🇮',
  fr: '🇫🇷',
  hi: '🇮🇳',
  it: '🇮🇹',
  ja: '🇯🇵',
  ko: '🇰🇷',
  nl: '🇳🇱',
  pl: '🇵🇱',
  pt: '🇵🇹',
};

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  tr: 'Türkçe',
  en: 'English',
  ru: 'Русский',
  ar: 'العربية',
  de: 'Deutsch',
  el: 'Ελληνικά',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  hi: 'हिन्दी',
  it: 'Italiano',
  ja: '日本語',
  ko: '한국어',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português',
};

/** İkinci satır + arama için İngilizce adlar */
export const LANGUAGE_ENGLISH_NAMES: Record<SupportedLanguage, string> = {
  tr: 'Turkish',
  en: 'English',
  ru: 'Russian',
  ar: 'Arabic',
  de: 'German',
  el: 'Greek',
  es: 'Spanish',
  fi: 'Finnish',
  fr: 'French',
  hi: 'Hindi',
  it: 'Italian',
  ja: 'Japanese',
  ko: 'Korean',
  nl: 'Dutch',
  pl: 'Polish',
  pt: 'Portuguese',
};

const supportedLanguageSet = new Set<string>(SUPPORTED_LANGUAGES);

export function isSupportedLanguage(code: string): code is SupportedLanguage {
  return supportedLanguageSet.has(code);
}

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';

const mapToSupported = (code: string): SupportedLanguage => {
  const base = (code.split(/[-_]/)[0] ?? 'en').toLowerCase();
  return isSupportedLanguage(base) ? base : 'en';
};

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
    ar: { translation: ar },
    de: { translation: de },
    el: { translation: el },
    es: { translation: es },
    fi: { translation: fi },
    fr: { translation: fr },
    hi: { translation: hi },
    it: { translation: it },
    ja: { translation: ja },
    ko: { translation: ko },
    nl: { translation: nl },
    pl: { translation: pl },
    pt: { translation: pt },
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
  const base = (i18n.language.split(/[-_]/)[0] ?? 'en').toLowerCase();
  return isSupportedLanguage(base) ? base : 'en';
}

export default i18n;
