"use client";
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';

export default function Dashboard() {
	const { t } = useTranslation('app');
	const pathname = usePathname();
	const segments = pathname?.split('/').filter(Boolean) || [];
	const locale = segments[0] === 'en' ? 'en' : 'de';
	return (
		<div>
			<h1>{t('dashboard')}</h1>
			<p>{t('welcome.message')}</p>
			<div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', border: '1px solid #ccc' }}>
				<strong>Debug Info:</strong><br />
				Current path: {pathname}<br />
				Locale segment: {locale}
			</div>
		</div>
	);
}
