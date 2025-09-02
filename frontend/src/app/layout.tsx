import React from 'react';

export const dynamic = 'force-dynamic'; // ensure dynamic to avoid stale 404 prerender during debugging

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html suppressHydrationWarning>
			<title>LoyaCare CRM</title>
			<meta name="description" content="LoyaCare CRM Application" />
			<body style={{ margin: 0 }}>{children}</body>
		</html>
	);
}
