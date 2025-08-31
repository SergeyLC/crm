import { DealsTable } from "@/features";
import { store } from "@/shared/lib/store";
import { dealApi } from "@/entities/deal/api";

export default async function DealsPage() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_BACKEND_API_URL
  ) {
    try {
      await store.dispatch(dealApi.endpoints.getDeals.initiate({}));
    } catch (e) {
      console.warn("Failed to prefetch deals data:", e);
    }
  }
  return <DealsTable />;
}
