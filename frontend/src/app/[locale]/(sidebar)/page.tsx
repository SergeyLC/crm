"use client";
import { useTranslation } from 'react-i18next';
import { usePathname } from 'next/navigation';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { UserPipelinesDashboard } from '@/widgets';
import { PipelineList, useAuth } from '@/features';

export default function Dashboard() {
	const { t } = useTranslation('app');
  const { user } = useAuth();
	const pathname = usePathname();
	const segments = pathname?.split('/').filter(Boolean) || [];
	const locale = segments[0] === 'en' ? 'en' : 'de';
	return (
    <div>
      <h1>{t("dashboard")}</h1>
      <p>{t("welcome.message")}</p>
      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
          border: "1px solid #ccc",
        }}
      >
        <strong>Debug Info:</strong>
        <br />
        Current path: {pathname}
        <br />
        Locale segment: {locale}
      </div>
      <Grid container spacing={3}>
        {/* Andere Dashboard-Widgets */}

        {/* Pipelines-Sektion */}
        { user && (
            <Paper sx={{ p: 3 }}>
              <UserPipelinesDashboard userId={user.id} />
            </Paper>
        )}
      </Grid>
      <PipelineList />

    </div>
  );
}
