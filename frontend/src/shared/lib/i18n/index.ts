// Реэкспорт серверной и клиентской версий i18n
import serverI18n from './server';
import clientI18n from './client';

export { serverI18n, clientI18n };

// Также экспортируем функцию изменения языка из серверной версии
export { changeLanguage } from './server';

// Экспортируем утилиты для работы с i18n
export { initializeI18n, getCurrentLanguage } from './utils';
