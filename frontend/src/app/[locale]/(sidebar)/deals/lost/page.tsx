import { WonLostDealsTable } from "@/features/deal/DealsTable/ui/WonLostDealsTable";

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

export default function LostDealsPage() {
  return <WonLostDealsTable isWon={false} />;
}
