import { Skeleton } from "@/components/ui/skeleton";

export function AnalyticsLoadingSkeleton() {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] flex-col gap-4">
      <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="min-h-0 flex-1 rounded-xl" />
    </div>
  );
}
