import { SpendingChartCard } from "@/app/(app)/dashboard/cards/SpendingChartCard";
import { SAMPLE_ANALYTICS } from "./sampleAnalytics";

export function ShowcasePanel() {
  return (
    // contain-size: decoration only, so it fills the row the form sets instead of making the page taller (and scroll); overflow is clipped at the bottom.
    <aside className="hidden flex-col justify-center-safe gap-8 overflow-hidden rounded-3xl bg-indigo-600 p-12 text-white contain-size lg:flex">
      <div className="max-w-xl space-y-4">
        <h2 className="text-4xl font-medium leading-tight">
          Keep your money simple.
        </h2>
        <p className="text-indigo-100">
          Import your transactions, sort them into categories and see where
          every euro goes.
        </p>
      </div>
      <div
        aria-hidden
        inert
        className="grid max-w-xl grid-cols-2 gap-3 text-card-foreground"
      >
        <div className="col-span-2">
          <SpendingChartCard analytics={SAMPLE_ANALYTICS} />
        </div>
        <div className="rounded-2xl bg-white/15 p-5 text-white">
          <p className="text-sm text-indigo-100">Total balance</p>
          <p className="mt-2 text-3xl font-semibold">€12,480</p>
        </div>
        <div className="rounded-2xl bg-card p-5">
          <p className="text-sm text-muted-foreground">Saved this month</p>
          <p className="mt-2 text-3xl font-semibold">€640</p>
          <p className="mt-1 text-xs text-emerald-600">↑ 8% from last month</p>
        </div>
      </div>
    </aside>
  );
}
