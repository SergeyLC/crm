import path from 'path';

export default {
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    localeDetection: true,
  },
  defaultNS: 'common',
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: ['common', 'app', 'auth', 'shared'],
};