import path from 'path';
import { generatedNS } from './src/generated-i18n';
export default {
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en'],
    localeDetection: true,
  },
  defaultNS: 'shared',
  // localePath: path.resolve('./public/locales'),
  reloadOnPrerender: process.env.NODE_ENV === 'development',
  ns: [...generatedNS],
};