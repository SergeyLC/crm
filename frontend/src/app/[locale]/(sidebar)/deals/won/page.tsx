import { WonLostDealsTable } from '@/features/deal';

export default async function WonDealsPage() {
  return <WonLostDealsTable isWon={true} />;
}
