import type { Metadata } from "next";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getReports } from "@/lib/models/Report";
import { ReportsPageContent } from "./ReportsPageContent";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  const reports = await getReports();

  return (
    <PageWrapper title="Reports">
      <ReportsPageContent reportsResponse={reports} />
    </PageWrapper>
  );
}
