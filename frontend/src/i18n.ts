import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files directly
import commonDe from "./locales/de/common.json";
import commonEn from "./locales/en/common.json";
import appDe from "./locales/de/app.json";
import appEn from "./locales/en/app.json";
import authDe from "./locales/de/auth.json";
import authEn from "./locales/en/auth.json";
import sharedDe from "./locales/de/shared.json";
import sharedEn from "./locales/en/shared.json";
import dealDe from "./locales/de/deal.json";
import dealEn from "./locales/en/deal.json";
import appointmentDe from "./locales/de/appointment.json";
import appointmentEn from "./locales/en/appointment.json";
import leadDe from "./locales/de/lead.json";
import leadEn from "./locales/en/lead.json";
import userDe from "./locales/de/user.json";
import userEn from "./locales/en/user.json";
import kanbanDe from "./locales/de/kanban.json";
import kanbanEn from "./locales/en/kanban.json";

const resources = {
  de: {
    common: commonDe,
    app: appDe,
    auth: authDe,
    shared: sharedDe,
    deal: dealDe,
    appointment: appointmentDe,
    lead: leadDe,
    user: userDe,
    kanban: kanbanDe,
  },
  en: {
    common: commonEn,
    app: appEn,
    auth: authEn,
    shared: sharedEn,
    deal: dealEn,
    appointment: appointmentEn,
    lead: leadEn,
    user: userEn,
    kanban: kanbanEn,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'de', // Set default language
    fallbackLng: 'de',
    defaultNS: "common",
    ns: [
      "common",
      "app",
      "auth",
      "shared",
      "deal",
      "appointment",
      "lead",
      "user",
      "kanban",
    ],
    supportedLngs: ["de", "en"],
    load: "languageOnly",

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

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
