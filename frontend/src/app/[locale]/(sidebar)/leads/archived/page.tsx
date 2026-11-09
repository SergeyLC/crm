import { Suspense } from "react";
import { LeadsTable } from "@/features";

export const revalidate = 60;

export async function generateStaticParams() {
  return [{ locale: "en" }, { locale: "de" }];
}

function ArchivedLeadsLoading() {
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
      Loading...
    </div>
  );
}

export default function ArchivedLeadsPage() {
  return (
    <Suspense fallback={<ArchivedLeadsLoading />}>
      <LeadsTable showArchived={true} />
    </Suspense>
  );
}
