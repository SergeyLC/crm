import { WonLostDealsTable } from '@/features/deal';

export default async function LostDealsPage() {
  return <WonLostDealsTable isWon={false} />;
}
