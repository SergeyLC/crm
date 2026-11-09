import { DealsTable } from "@/features/deal";

// Client-side fetch only: SSR of full deal graphs (notes/appointments) was
// driving frontend container OOM (~750MB / 15–20 min under the 768MB limit).
export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

export default function DealsPage() {
  return <DealsTable />;
}
