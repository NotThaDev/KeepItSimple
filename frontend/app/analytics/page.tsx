import { AnalyticsProvider, parseAnalyticsView } from "@/stores/analytics";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import {
  getExpenseAnalytics,
  getIncomeAnalytics,
} from "@/lib/models/Analytics";
import { AnalyticsPageContent } from "./AnalyticsPageContent";
import { AnalyticsViewSelector } from "./AnalyticsViewSelector";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const view = parseAnalyticsView(Object.keys(await searchParams));
  const [incomeResponse, expenseResponse] = await Promise.all([
    getIncomeAnalytics(),
    getExpenseAnalytics(),
  ]);

  return (
    <AnalyticsProvider
      incomeResponse={incomeResponse}
      expenseResponse={expenseResponse}
      view={view}
    >
      <PageWrapper title="Analytics" extraContent={<AnalyticsViewSelector />}>
        <AnalyticsPageContent />
      </PageWrapper>
    </AnalyticsProvider>
  );
}
