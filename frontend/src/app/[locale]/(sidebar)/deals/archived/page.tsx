import { ArchivedDealsTable } from "@/features/deal/DealsTable/ui/ArchivedDealsTable";
import { Suspense } from "react";

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

function ArchivedDealsLoading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "400px",
        fontSize: "16px",
        color: "#666",
      }}
    >
      Loading archived deals...
    </div>
  );
}

export default function ArchivedDealsPage() {
  return (
    <Suspense fallback={<ArchivedDealsLoading />}>
      <ArchivedDealsTable />
    </Suspense>
  );
}
