"use client";
import React, { useEffect } from 'react';
import '@/shared/lib/i18n/client';
import { useTranslation } from 'react-i18next';

// Global error boundary for root (outside locale segment). For errors inside [locale], Next will still surface this.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
	const { t } = useTranslation('app');

	useEffect(() => {
		console.error('[GlobalError boundary]', error);
	}, [error]);

	return (
		<div
			lang="de"
			style={{
				fontFamily: 'sans-serif',
				margin: 0,
				padding: 32,
				minHeight: '100vh',
				backgroundColor: '#fff',
				color: '#000',
			}}
		>
			<h1 style={{ marginTop: 0 }}>{t('applicationError')}</h1>
			<p>{t('somethingWentWrong')}</p>
			{error?.digest && (
				<p style={{ fontSize: 12, opacity: 0.7 }}>
					{t('digest')}: <code>{error.digest}</code>
				</p>
			)}
			<button onClick={reset} style={{ padding: '6px 14px', cursor: 'pointer' }}>
				{t('tryAgain')}
			</button>
		</div>
	);
}