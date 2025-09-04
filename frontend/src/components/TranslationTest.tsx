"use client";

import { useTranslation } from 'react-i18next';

export function TranslationTest() {
  const { t, i18n } = useTranslation('common');
  const { t: tGroup, ready: groupReady } = useTranslation('group');

  return (
    <div>
      <h3>Translation Test</h3>
      <p>Current language: {i18n.language}</p>
      <p>Is initialized: {i18n.isInitialized ? 'Yes' : 'No'}</p>
      <p>Test translation: {t('app.title')}</p>
      <p>Common create: {t('common.create')}</p>

      <h4>Group Namespace Test</h4>
      <p>Group ready: {groupReady ? 'Yes' : 'No'}</p>
      <p>Group test: {tGroup('sections.groupDetails')}</p>
      <p>Group validation: {tGroup('validation.nameRequired')}</p>
    </div>
  );
}
