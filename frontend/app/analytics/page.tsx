import {
  AnalyticsProvider,
  loadAnalytics,
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
  const view = parseAnalyticsView(Object.keys(await searchParams));
  const payload = await loadAnalytics(view);

  return (
    <AnalyticsProvider {...payload}>
      <PageWrapper title="Analytics" extraContent={<AnalyticsViewSelector />}>
        <AnalyticsPageContent />
      </PageWrapper>
    </AnalyticsProvider>
  );
}
