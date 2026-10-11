import {
  AnalyticsProvider,
  loadAnalytics,
  parseAnalyticsMonth,
  parseAnalyticsView,
} from "@/stores/analytics";
import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import { AnalyticsPageContent } from "./AnalyticsPageContent";
import { AnalyticsViewSelector } from "./AnalyticsViewSelector";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const view = parseAnalyticsView(Object.keys(params));
  const month = parseAnalyticsMonth(params);
  const payload = await loadAnalytics(view, month);

  return (
    <AnalyticsProvider {...payload} month={month}>
      <PageWrapper title="Analytics" extraContent={<AnalyticsViewSelector />}>
        <AnalyticsPageContent />
      </PageWrapper>
    </AnalyticsProvider>
  );
}
