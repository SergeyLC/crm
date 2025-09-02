import { DealsTable } from "@/features";

// ISR configuration - will be ignored in development
export const revalidate = 60;

export default async function DealsPage() {
  // Data fetching strategy: Using TanStack Query for client-side fetching
  // const deals = undefined;
  return <DealsTable />;
}
