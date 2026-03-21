"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
};

const translations: Record<string, Record<string, string>> = {
  English: {
    "nav.home": "Home",
    "nav.track": "Track Complaint",
    "nav.admin": "Admin Area",
    "nav.dashboard": "Dashboard",
    "nav.signout": "Sign Out",
    "nav.login": "Official Login",
    "nav.portal": "Citizen Portal",
    "home.hero": "AI-Powered Civic Governance",
    "home.subhero": "Report, track, and resolve municipal issues faster with Loksetu's intelligent system.",
  },
  Hindi: {
    "nav.home": "होम",
    "nav.track": "शिकायत ट्रैक करें",
    "nav.admin": "व्यवस्थापक क्षेत्र",
    "nav.dashboard": "डैशबोर्ड",
    "nav.signout": "साइन आउट",
    "nav.login": "आधिकारिक लॉगिन",
    "nav.portal": "नागरिक पोर्टल",
    "home.hero": "AI-संचालित नागरिक प्रशासन",
    "home.subhero": "लोकसेतु की बुद्धिमान प्रणाली के साथ नगरपालिका के मुद्दों की रिपोर्ट करें, ट्रैक करें और तेज़ी से समाधान करें।",
  },
  Punjabi: {
    "nav.home": "ਮੁੱਖ ਪੰਨਾ",
    "nav.track": "ਸ਼ਿਕਾਇਤ ਨੂੰ ਟਰੈਕ ਕਰੋ",
    "nav.admin": "ਪ੍ਰਬੰਧਕ ਖੇਤਰ",
    "nav.dashboard": "ਡੈਸ਼ਬੋਰਡ",
    "nav.signout": "ਸਾਈਨ ਆਉਟ",
    "nav.login": "ਅਧਿਕਾਰਤ ਲੌਗਇਨ",
    "nav.portal": "ਨਾਗਰਿਕ ਪੋਰਟਲ",
    "home.hero": "AI-ਸੰਚਾਲਿਤ ਨਾਗਰਿਕ ਪ੍ਰਸ਼ਾਸਨ",
    "home.subhero": "ਲੋਕਸੇਤੂ ਦੀ ਬੁੱਧੀਮਾਨ ਪ੍ਰਣਾਲੀ ਨਾਲ ਮਿਊਂਸੀਪਲ ਮੁੱਦਿਆਂ ਦੀ ਰਿਪੋਰਟ ਕਰੋ, ਟਰੈਕ ਕਰੋ ਅਤੇ ਤੇਜ਼ੀ ਨਾਲ ਹੱਲ ਕਰੋ।",
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("English");

  useEffect(() => {
    const savedInfo = localStorage.getItem("loksetu_language");
    if (savedInfo && translations[savedInfo]) {
      setLanguageState(savedInfo);
    }
  }, []);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("loksetu_language", lang);
  };

  const t = (key: string) => {
    return translations[language]?.[key] || translations["English"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
