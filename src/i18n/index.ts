import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import vi from './vi.json';
import ko from './ko.json';
import en from './en.json';

const resources = {
  vi: { translation: vi },
  ko: { translation: ko },
  en: { translation: en },
};

// Get saved language or default to Vietnamese
const savedLanguage = localStorage.getItem('q-train-language') || 'vi';

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
