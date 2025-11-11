import { DealExt } from '@/entities/deal';
import { WonLostDealsTable } from '@/features/deal';
import { ssrFetch } from '@/shared/api';

export const revalidate = 60;

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

export default async function WonDealsPage() {
  const deals = await ssrFetch<DealExt[]>("deals/won");

  return <WonLostDealsTable isWon={true} initialData={deals || undefined} />;
}
