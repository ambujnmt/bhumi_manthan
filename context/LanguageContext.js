import { createContext, useState, useEffect } from "react";
import en from "../locales/en.json";
import tur from "../locales/tur.json";

// Create Context
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState("en");
  const [translations, setTranslations] = useState(en); // Default to English

  // Load language preference from localStorage on mount
  useEffect(() => {
    const storedLang = localStorage.getItem("selectedLanguage") || "en";
    setLocale(storedLang);
    loadTranslations(storedLang);
  }, []);

  // Function to load translations dynamically
  const loadTranslations = (lang) => {
    switch (lang) {
      case "tur":
        setTranslations(tur);
        break;
      default:
        setTranslations(en);
        break;
    }
  };

  // Function to switch language
  const switchLanguage = (lang) => {
    localStorage.setItem("selectedLanguage", lang);
    setLocale(lang);
    loadTranslations(lang);
  };

  // Function to translate text
  const translateText = (textKey) => {
    return translations[textKey] || textKey; // Return key if translation not found
  };

  return (
    <LanguageContext.Provider value={{ locale, switchLanguage, translateText }}>
      {children}
    </LanguageContext.Provider>
  );
};
