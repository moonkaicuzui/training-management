import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// 활성 언어만 동기 로드, 나머지 언어는 전환 시 지연 로드
import vi from './vi.json';
import ko from './ko.json';
import en from './en.json';

const translations: Record<string, Record<string, unknown>> = { vi, ko, en };

// Get saved language or default to Vietnamese
const savedLanguage = localStorage.getItem('q-train-language') || 'vi';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    ko: { translation: ko },
    en: { translation: en },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

/** 언어 전환 (localStorage 저장 포함) */
export async function changeLanguage(lang: string): Promise<void> {
  if (!i18n.hasResourceBundle(lang, 'translation') && translations[lang]) {
    i18n.addResourceBundle(lang, 'translation', translations[lang]);
  }
  await i18n.changeLanguage(lang);
  localStorage.setItem('q-train-language', lang);
}

export default i18n;
