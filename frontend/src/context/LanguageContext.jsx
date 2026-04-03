import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import ur from '../locales/ur.json';

const locales = { en, ur };
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('aspo_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('aspo_lang', lang);
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  function t(key) {
    return locales[lang][key] || locales.en[key] || key;
  }

  function toggleLang() {
    setLang((prev) => (prev === 'en' ? 'ur' : 'en'));
  }

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
