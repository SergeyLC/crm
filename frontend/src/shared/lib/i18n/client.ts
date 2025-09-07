'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import generatedI18n, { generatedNS } from '@/shared/generated/i18n/generated_i18n';

// Проверяем, не был ли i18next уже инициализирован
if (!i18n.isInitialized) {
  console.log('Initializing i18next client-side');
  
  type NamespacePayload = Record<string, unknown>;
  
  interface Localization {
    [lang: string]: Record<string, NamespacePayload>;
  }
  
  const fixedResources: Localization = {
    de: {},
    en: {},
  };
  
  const fixedNamespaces: string[] = [];
  
  const resources: Localization = fixedResources;
  
  // Merge generated component-local translations into the resources object.
  try {
    if (generatedI18n && typeof generatedI18n === "object") {
      for (const [lang, nsMap] of Object.entries(generatedI18n)) {
        // ensure target language exists
        resources[lang] = resources[lang] || {};
        for (const [ns, payload] of Object.entries(nsMap)) {
          const existing = (resources[lang][ns] || {});
          // perform deep merge so nested objects are preserved
          resources[lang][ns] = { ...existing, ...payload };
        }
      }
    }
  } catch (error) {
    console.error('Error initializing i18next resources:', error);
  }
  
  i18n.use(initReactI18next).init({
    resources,
    lng: typeof window !== 'undefined' ? window.localStorage.getItem('i18nextLng') || 'de' : 'de',
    fallbackLng: 'de',
    defaultNS: 'shared',
    ns: [...fixedNamespaces, ...generatedNS],
    supportedLngs: ['de', 'en'],
    load: 'languageOnly',
    
    interpolation: {
      escapeValue: false,
    },
    
    react: {
      useSuspense: false,
    },
    
    // Ensure nested keys are parsed and objects can be returned when needed
    returnObjects: true,
    keySeparator: '.',
    
    // Optimize initialization
    initImmediate: true,
    
    debug: false,
  });
}

export default i18n;
