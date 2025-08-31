"use client";
import { ProtectedRoute } from '@/features/auth';
import { useTranslation } from 'react-i18next';

export default function AdminPage() {
  const { t } = useTranslation();
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <h1>{t('app:adminDashboard')}</h1>
    </ProtectedRoute>
  );
}
