import { Container } from '@mui/material';
import { ProtectedRoute } from '@/features/auth';
import { GroupsTable } from '@/features/group';

export default function GroupsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <Container maxWidth={false} component="main" sx={{p:0,m:0,height:'100%',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <GroupsTable />
      </Container>
    </ProtectedRoute>
  );
}
