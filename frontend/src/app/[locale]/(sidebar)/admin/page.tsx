import { ProtectedRoute } from '@/features/auth';
import { PipelineManagement } from '@/features/pipeline';
import { Box } from '@mui/material';

export default async function AdminPage() {
  return (
    <Box sx={{ p: 3 }}>
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <PipelineManagement />
      </ProtectedRoute>
    </Box>
  );
}