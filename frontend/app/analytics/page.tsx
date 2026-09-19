import { PageWrapper } from "@/components/common/pageContainer/PageWrapper";

export default function AnalyticsPage() {
  return (
    <PageWrapper title="Analytics" maximizeContent>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          View your analytics here.
        </p>
      </div>
    </PageWrapper>
  );
}
