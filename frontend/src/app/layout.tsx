import React from "react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic"; // ensure dynamic to avoid stale 404 prerender during debugging

export const metadata: Metadata = {
	title: "CRM",
	description: "CRM Application",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="de" suppressHydrationWarning>
			<body style={{ margin: 0 }}>{children}</body>
		</html>
	);
}
