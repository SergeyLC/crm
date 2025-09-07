import i18next from "i18next";
import generatedI18n, { generatedNS } from "@/shared/generated/i18n/generated_i18n";

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
  console.error('Error merging i18n resources:', error);
}

// Create a standalone i18next instance without React integration
const i18n = i18next.createInstance();

i18n.init({
  resources,
  lng: "de", // Set default language
  fallbackLng: "de",
  defaultNS: "shared",
  ns: [...fixedNamespaces, ...generatedNS],
  supportedLngs: ["de", "en"],
  
  interpolation: {
    escapeValue: false,
  },
  
  // Ensure nested keys are parsed and objects can be returned when needed
  returnObjects: true,
  keySeparator: ".",
  
  debug: false,
});

// Utility function to change language
export const changeLanguage = async (locale: string) => {
  if (typeof window !== "undefined") {
    await i18n.changeLanguage(locale);
  }
};

export default i18n;
