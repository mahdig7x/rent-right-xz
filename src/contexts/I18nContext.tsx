import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Locale, translations } from '@/i18n/translations';

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem('rentright-locale');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('rentright-locale', l);
  }, []);

  const t = useCallback((key: string): string => {
    return translations[locale][key] || translations['en'][key] || key;
  }, [locale]);

  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const isRtl = locale === 'ar';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', locale);
    document.documentElement.style.fontFamily = locale === 'ar'
      ? '"Noto Sans Arabic", "Plus Jakarta Sans", system-ui, sans-serif'
      : '"Plus Jakarta Sans", system-ui, sans-serif';
  }, [locale, dir]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, dir, isRtl }}>
      {children}
    </I18nContext.Provider>
  );
};
