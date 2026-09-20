import { AnalyticsProvider, parseAnalyticsView } from "@/stores/analytics";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { getIncomeAnalytics } from "@/lib/models/Analytics";
import { AnalyticsPageContent } from "./AnalyticsPageContent";
import { AnalyticsViewSelector } from "./AnalyticsViewSelector";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const incomeResponse = await getIncomeAnalytics();
  const view = parseAnalyticsView(Object.keys(await searchParams));

  return (
    <AnalyticsProvider incomeResponse={incomeResponse} view={view}>
      <PageWrapper title="Analytics" extraContent={<AnalyticsViewSelector />}>
        <AnalyticsPageContent />
      </PageWrapper>
    </AnalyticsProvider>
  );
}
