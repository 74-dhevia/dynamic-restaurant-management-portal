import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations, LANGUAGES } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('zestro_lang') || 'en');

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem('zestro_lang', lang);
  }, [lang]);

  const changeLang = useCallback((code) => {
    setLang(code);
  }, []);

  const t = useCallback((key, fallback) => {
    return translations[lang]?.[key] ?? translations.en[key] ?? fallback ?? key;
  }, [lang]);

  const currentLanguage = useMemo(() => {
    return LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];
  }, [lang]);

  const value = useMemo(() => ({ lang, changeLang, t, currentLanguage, languages: LANGUAGES }), [lang, changeLang, t, currentLanguage]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  return useContext(LanguageContext);
}
