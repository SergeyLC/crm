import { leadApi } from "@/entities/lead/api";
import { DealsTable } from "@/features";
// import { DealExt } from "@/entities/deal/model/types";
// import { ssrFetch } from "@/shared/api/ssrFetch";
import { ssrPrefetch } from "@/shared/api/ssrPrefetch";

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  // Data fetching strategy: Currently using ssrPrefetch to pre-populate the cache 
  // for client-side fetching via RTK Query.
  // For more details, see https://redux-toolkit.js.org/rtk-query/usage/server-side-rendering
  // If using ssrFetch, data is fetched on the server and passed directly, but cache updates
  // may not be reflected on the client.
  // when we use ssrFetch then useGetDealsQuery hasn't be called and the data won't be
  // available in the cache and after changing the data on the server, 
  // the client won't see the updated data
  const deals = undefined; // await ssrFetch<DealExt[]>("deals");
  await ssrPrefetch(leadApi.endpoints.getLeads);
  return <DealsTable initialData={deals} />;
}
