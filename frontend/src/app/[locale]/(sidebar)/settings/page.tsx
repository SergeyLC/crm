"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";

export default function SettingsPage() {
  const { t } = useTranslation("settings");

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        {t("title", "Settings")}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gap: 3
      }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("profile", "Profile Settings")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("profileDescription", "Manage your profile information and preferences.")}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("notifications", "Notifications")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("notificationsDescription", "Configure your notification preferences.")}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("security", "Security")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("securityDescription", "Manage your password and security settings.")}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {t("preferences", "Preferences")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t("preferencesDescription", "Customize your application preferences.")}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}