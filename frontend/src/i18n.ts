import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files directly
import commonDe from "./locales/de/common.json";
import commonEn from "./locales/en/common.json";
import groupDe from "./locales/de/group.json";
import groupEn from "./locales/en/group.json";
// import appDe from "./locales/de/app.json";
// import appEn from "./locales/en/app.json";
// import authDe from "./locales/de/auth.json";
// import authEn from "./locales/en/auth.json";
// import sharedDe from "./locales/de/shared.json";
// import sharedEn from "./locales/en/shared.json";
// import dealDe from "./locales/de/deal.json";
// import dealEn from "./locales/en/deal.json";
// import appointmentDe from "./locales/de/appointment.json";
// import appointmentEn from "./locales/en/appointment.json";
// import leadDe from "./locales/de/lead.json";
// import leadEn from "./locales/en/lead.json";
// import userDe from "./locales/de/user.json";
// import userEn from "./locales/en/user.json";
// import kanbanDe from "./locales/de/kanban.json";
// import kanbanEn from "./locales/en/kanban.json";
// import groupDe from "./locales/de/group.json";
// import groupEn from "./locales/en/group.json";
// Generated component-local i18n (auto-generated)
import generatedI18n, { generatedNS } from "./locales/generated_i18n";
import deepMergeObjects from './shared/lib/deepMerge';
type NamespacePayload = Record<string, unknown>;

interface Localization {
  [lang: string]: Record<string, NamespacePayload>;
}
const fixedResources: Localization = {
  de: {
    common: commonDe,
  group: groupDe,
  // app: appDe,
    // auth: authDe,
    // shared: sharedDe,
    // deal: dealDe,
    // appointment: appointmentDe,
    // lead: leadDe,
    // user: userDe,
    // kanban: kanbanDe,
    // group: groupDe,
  },
  en: {
    common: commonEn,
  group: groupEn,
  // app: appEn,
    // auth: authEn,
    // shared: sharedEn,
    // deal: dealEn,
    // appointment: appointmentEn,
    // lead: leadEn,
    // user: userEn,
    // kanban: kanbanEn,
    // group: groupEn,
  },
};

const fixedNamespaces: string[] = ["common"]; // Add any fixed namespaces here if needed

const resources: Localization = fixedResources;
// Merge generated component-local translations into the resources object.
// generatedI18n has shape Record<lang, Record<namespace, any>>
try {
  if (generatedI18n && typeof generatedI18n === 'object') {
    for (const [lang, nsMap] of Object.entries(generatedI18n) as Array<[string, Record<string, Record<string, unknown>>]>) {
      // ensure target language exists
  // cast to any for dynamic assignment within this merge block
      resources[lang] = resources[lang] || {};
      for (const [ns, payload] of Object.entries(nsMap) as Array<[string, Record<string, unknown>]>) {
        const existing = (resources[lang][ns] || {}) as Record<string, unknown>;
        // perform deep merge so nested objects (e.g. table.title) are preserved
        resources[lang][ns] = deepMergeObjects(existing, payload) as unknown as NamespacePayload;
      }
    }
  }
} catch {
  // keep behavior non-breaking if generated file is missing or malformed
}

// console.log("i18n resources:", JSON.stringify(resources, null, 2));
// console.log("i18n namespaces:", [...fixedNamespaces, ...generatedNS]);

// Debug: show whether the group namespace contains the expected keys for the default language
  // ...existing code...

i18n.use(initReactI18next).init({
  resources, // <- hier das gemergte Objekt verwenden
  lng: "de", // Set default language
  fallbackLng: "de",
  defaultNS: "common",
  ns: [...fixedNamespaces, ...generatedNS],
  supportedLngs: ["de", "en"],
  load: "languageOnly",
  preload: ["de", "en"],
  partialBundledLanguages: true,

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
  initImmediate: true, // Initialize immediately

  debug: false,
});

// Function to change language safely
export const changeLanguage = async (locale: string) => {
  if (typeof window !== 'undefined') {
    await i18n.changeLanguage(locale);
  }
};

export default i18n;
