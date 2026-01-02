/**
 * i18n Translation Tests
 * 다국어 번역 파일의 일관성과 완전성을 검증합니다.
 */

import { describe, it, expect } from 'vitest';
import koJson from './ko.json';
import enJson from './en.json';
import viJson from './vi.json';

type TranslationObject = Record<string, unknown>;

/**
 * Recursively get all keys from a nested object with dot notation
 */
function getAllKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = [];

  for (const key of Object.keys(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const value = obj[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getAllKeys(value as TranslationObject, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * Get value from nested object using dot notation key
 */
function getValue(obj: TranslationObject, key: string): unknown {
  const keys = key.split('.');
  let current: unknown = obj;

  for (const k of keys) {
    if (current && typeof current === 'object' && k in current) {
      current = (current as TranslationObject)[k];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Extract interpolation variables from a string (e.g., {{count}}, {{name}})
 */
function extractInterpolationVars(str: string): string[] {
  const matches = str.match(/\{\{(\w+)\}\}/g);
  return matches ? matches.sort() : [];
}

describe('i18n Translation Files', () => {
  const translations = {
    ko: koJson as TranslationObject,
    en: enJson as TranslationObject,
    vi: viJson as TranslationObject,
  };

  const languages = Object.keys(translations) as Array<'ko' | 'en' | 'vi'>;
  const referenceLanguage = 'ko'; // Korean is the primary language
  const referenceKeys = getAllKeys(translations[referenceLanguage]);

  describe('Key Consistency', () => {
    it('should have all keys from Korean in English', () => {
      const enKeys = getAllKeys(translations.en);
      const missingInEn = referenceKeys.filter(key => !enKeys.includes(key));

      expect(missingInEn).toEqual([]);
    });

    it('should have all keys from Korean in Vietnamese', () => {
      const viKeys = getAllKeys(translations.vi);
      const missingInVi = referenceKeys.filter(key => !viKeys.includes(key));

      expect(missingInVi).toEqual([]);
    });

    it('should not have extra keys in English that are not in Korean', () => {
      const enKeys = getAllKeys(translations.en);
      const extraInEn = enKeys.filter(key => !referenceKeys.includes(key));

      expect(extraInEn).toEqual([]);
    });

    it('should not have extra keys in Vietnamese that are not in Korean', () => {
      const viKeys = getAllKeys(translations.vi);
      const extraInVi = viKeys.filter(key => !referenceKeys.includes(key));

      expect(extraInVi).toEqual([]);
    });
  });

  describe('Value Validation', () => {
    for (const lang of languages) {
      describe(`${lang.toUpperCase()} translations`, () => {
        it('should have non-empty string values for all keys', () => {
          const keys = getAllKeys(translations[lang]);
          const emptyKeys: string[] = [];

          for (const key of keys) {
            const value = getValue(translations[lang], key);
            // Allow empty strings for count suffix in en/vi
            if (key === 'common.count' && (lang === 'en' || lang === 'vi')) {
              continue;
            }
            if (typeof value !== 'string' || value.trim() === '') {
              emptyKeys.push(key);
            }
          }

          expect(emptyKeys).toEqual([]);
        });
      });
    }
  });

  describe('Interpolation Consistency', () => {
    it('should have consistent interpolation variables across all languages', () => {
      const inconsistentKeys: Array<{
        key: string;
        differences: Record<string, string[]>;
      }> = [];

      for (const key of referenceKeys) {
        const koValue = getValue(translations.ko, key);
        if (typeof koValue !== 'string') continue;

        const koVars = extractInterpolationVars(koValue);
        if (koVars.length === 0) continue;

        const differences: Record<string, string[]> = { ko: koVars };
        let hasInconsistency = false;

        for (const lang of ['en', 'vi'] as const) {
          const value = getValue(translations[lang], key);
          if (typeof value === 'string') {
            const vars = extractInterpolationVars(value);
            differences[lang] = vars;

            if (JSON.stringify(koVars) !== JSON.stringify(vars)) {
              hasInconsistency = true;
            }
          }
        }

        if (hasInconsistency) {
          inconsistentKeys.push({ key, differences });
        }
      }

      expect(inconsistentKeys).toEqual([]);
    });
  });

  describe('Key Structure', () => {
    it('should have common section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('common');
      }
    });

    it('should have navigation section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('nav');
      }
    });

    it('should have header section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('header');
      }
    });

    it('should have dashboard section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('dashboard');
      }
    });

    it('should have employee section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('employee');
      }
    });

    it('should have program section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('program');
      }
    });

    it('should have session section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('session');
      }
    });

    it('should have schedule section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('schedule');
      }
    });

    it('should have messages section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('messages');
      }
    });

    it('should have auth section', () => {
      for (const lang of languages) {
        expect(translations[lang]).toHaveProperty('auth');
      }
    });
  });

  describe('Critical Keys', () => {
    const criticalKeys = [
      'common.save',
      'common.cancel',
      'common.delete',
      'common.edit',
      'common.loading',
      'nav.dashboard',
      'nav.employees',
      'nav.programs',
      'nav.schedule',
      'messages.saveSuccess',
      'messages.saveError',
      'auth.login',
      'auth.logout',
    ];

    for (const key of criticalKeys) {
      it(`should have critical key "${key}" in all languages`, () => {
        for (const lang of languages) {
          const value = getValue(translations[lang], key);
          expect(value).toBeDefined();
          expect(typeof value).toBe('string');
          expect((value as string).trim()).not.toBe('');
        }
      });
    }
  });

  describe('No HTML Injection', () => {
    it('should not contain HTML tags in translations', () => {
      const keysWithHtml: Array<{ lang: string; key: string; value: string }> = [];
      const htmlPattern = /<[^>]+>/;

      for (const lang of languages) {
        const keys = getAllKeys(translations[lang]);

        for (const key of keys) {
          const value = getValue(translations[lang], key);
          if (typeof value === 'string' && htmlPattern.test(value)) {
            keysWithHtml.push({ lang, key, value });
          }
        }
      }

      expect(keysWithHtml).toEqual([]);
    });
  });

  describe('Translation Quality', () => {
    it('should not have placeholder text like TODO or FIXME', () => {
      const placeholderKeys: Array<{ lang: string; key: string; value: string }> = [];
      const placeholderPattern = /\b(TODO|FIXME|XXX|PLACEHOLDER|TBD)\b/i;

      for (const lang of languages) {
        const keys = getAllKeys(translations[lang]);

        for (const key of keys) {
          const value = getValue(translations[lang], key);
          // Skip 'tbd' key as it's intentionally "TBD"
          if (key === 'common.tbd') continue;

          if (typeof value === 'string' && placeholderPattern.test(value)) {
            placeholderKeys.push({ lang, key, value });
          }
        }
      }

      expect(placeholderKeys).toEqual([]);
    });
  });
});
