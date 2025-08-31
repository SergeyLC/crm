"use client";
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '@/features';

export default function LoginPage() {
	const { t } = useTranslation();
	return (
		<Suspense fallback={<div>{t('app:loading')}</div>}>
			<LoginForm />
		</Suspense>
	);
}
