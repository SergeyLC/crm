import { generatedNS } from './src/generated-i18n';
export default {
  i18n: {
    defaultLocale: 'en',
    locales: ['de', 'en'],
    localeDetection: false,
  },
  defaultNS: 'shared',
  // localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: [...generatedNS],
};