const path = require('path');

module.exports = {
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    localeDetection: false,
  },
  defaultNS: 'common',
  localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: ['common', 'app', 'auth', 'shared'],
};
