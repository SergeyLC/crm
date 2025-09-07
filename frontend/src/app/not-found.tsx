"use client";
import React from 'react';
import '@/shared/lib/i18n/client';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
	const { t } = useTranslation('app');
	return (
		<div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'flex-start',fontFamily:'sans-serif',padding:32}}>
			<h1 style={{margin:0}}>{t('pageNotFound')}</h1>
			<p style={{margin:0,opacity:0.7}}>{t('notFoundHint')}</p>
		</div>
	);
}