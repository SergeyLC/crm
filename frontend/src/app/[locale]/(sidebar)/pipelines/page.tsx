import { ProtectedRoute } from '@/features/auth';
import { PipelineManagement } from '@/features/pipeline';
import  Container from '@mui/material/Container';

export default async function PipelinesPage() {
  return (
    <Container maxWidth={false} component="main" sx={{ p: 0, m: 0, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <ProtectedRoute allowedRoles={["ADMIN"]}>
        <PipelineManagement />
      </ProtectedRoute>
    </Container>
  );
}