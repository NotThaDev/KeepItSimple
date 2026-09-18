import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";
import {
  getPeriodInsight,
  parseAnalyticsSearchParams,
} from "@/lib/models/Analytics";
import { AnalyticsPageContent } from "./AnalyticsPageContent";

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { kind, range } = parseAnalyticsSearchParams(await searchParams);
  const insight = await getPeriodInsight(kind, range);

  return (
    <PageWrapper title="Analytics">
      <AnalyticsPageContent
        insightResponse={insight}
        kind={kind}
        range={range}
      />
    </PageWrapper>
  );
}
