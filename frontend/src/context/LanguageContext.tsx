// frontend/src/context/LanguageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { appStorage } from '../utils/storage';
import { Language, translations } from '../i18n/translations';

const LANGUAGE_STORAGE_KEY = 'app_language_preference';

interface LanguageContextType {
  language: Language;
  isEn: boolean;
  setLanguage: (lang: Language) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLangState] = useState<Language>('th');

  // Load language preference from storage on mount
  useEffect(() => {
    (async () => {
      const savedLang = await appStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'th') {
        setLangState(savedLang);
      }
    })();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLangState(newLang);
    await appStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
  };

  const toggleLanguage = async () => {
    const nextLang: Language = language === 'th' ? 'en' : 'th';
    await setLanguage(nextLang);
  };

  const isEn = language === 'en';

  // Translation helper function
  const t = (keyPath: string, params?: Record<string, string | number>): string => {
    const keys = keyPath.split('.');
    let current: any = translations[language];

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to Thai
        let fallback: any = translations.th;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === 'object' && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let result = current;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }

    return result;
  };

  return (
    <LanguageContext.Provider value={{ language, isEn, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
