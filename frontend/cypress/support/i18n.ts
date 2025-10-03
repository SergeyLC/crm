import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Simple test translations
const resources = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email',
      phone: 'Phone',
    },
  },
  de: {
    common: {
      save: 'Speichern',
      cancel: 'Abbrechen',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      phone: 'Telefon',
    },
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;