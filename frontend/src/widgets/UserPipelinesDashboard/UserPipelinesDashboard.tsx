"use client";

import { 
  Typography, Grid, Card, CardContent, 
  CardActions, Button, Box, Skeleton
} from '@mui/material';
import { useUserPipelines } from "@/entities/pipeline";
import { useTranslation } from 'react-i18next';

/**
 * Dashboard widget to display pipelines assigned to the current user
 */
export const UserPipelinesDashboard = ({ userId }: { userId: string }) => {
  const { t } = useTranslation('pipeline');
  const { data: pipelines, isLoading, error } = useUserPipelines(userId);

  if (isLoading) return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        {t("yourPipelines")}
      </Typography>
      <Grid container spacing={2}>
        {[1, 2, 3].map((i) => (
          // <Grid xs={12} md={6} lg={4} key={i}>
            <Card key={i}>
              <CardContent>
                <Skeleton variant="text" height={30} />
                <Skeleton variant="text" height={20} />
                <Skeleton variant="text" height={20} />
              </CardContent>
              <CardActions>
                <Skeleton variant="rectangular" width={100} height={36} />
              </CardActions>
            </Card>
          // </Grid>
        ))}
      </Grid>
    </Box>
  );
  
  if (error) return (
    <Box>
      <Typography color="error">
        {t('errorLoadingPipelines')}
      </Typography>
    </Box>
  );
  
  return (
    <Box>
      <Typography variant="h5" component="h2" gutterBottom>
        {t("yourPipelines")}
      </Typography>

      {!pipelines || pipelines.length === 0 ? (
        <Typography variant="body1">{t("noPipelinesAssigned")}</Typography>
      ) : (
        <Grid container spacing={2}>
          {pipelines.map((pipeline) => (
            // <Grid item xs={12} md={6} lg={4} key={pipeline.id}>
              <Card key={pipeline.id}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {pipeline.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pipeline.description || t("noDescription")}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    color="primary"
                    href={`/pipelines/${pipeline.id}`}
                  >
                    {t("viewPipeline")}
                  </Button>
                </CardActions>
              </Card>
            // </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};