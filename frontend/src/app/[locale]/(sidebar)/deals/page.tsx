import { DealsTable } from "@/features";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  // Data fetching strategy: Using TanStack Query for client-side fetching
  // const deals = undefined;
  return <DealsTable />;
}
