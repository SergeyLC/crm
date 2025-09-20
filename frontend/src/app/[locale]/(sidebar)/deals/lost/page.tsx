import { DealExt } from '@/entities/deal';
import { WonLostDealsTable } from '@/features/deal';
import { ssrFetch } from '@/shared/api';

// Generating static pages only for en and de
export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'de' },
  ];
}

export default async function LostDealsPage() {
    const deals = await ssrFetch<DealExt[]>("deals/lost");

  return <WonLostDealsTable isWon={false} initialData={deals || undefined} />;
}
