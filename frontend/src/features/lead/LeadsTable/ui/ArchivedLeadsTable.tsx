import { LeadsTable } from '@/features';

export default async function ArchivedLeadsPage() {
  return <LeadsTable showArchived={true} />;
}
