import { SpendingChartCard } from "@/app/(app)/dashboard/cards/SpendingChartCard";
import { TransactionPieChart } from "@/components/common/transactionTracker/TransactionPieChart";
import { SAMPLE_ANALYTICS, SAMPLE_CATEGORIES } from "./sampleAnalytics";

export function ShowcasePanel() {
  return (
    <aside className="hidden flex-col justify-center gap-8 rounded-3xl bg-indigo-600 p-12 text-white lg:flex">
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
        className="grid max-w-xl grid-cols-[auto_1fr] gap-3 text-card-foreground"
      >
        <div className="col-span-2">
          <SpendingChartCard analytics={SAMPLE_ANALYTICS} />
        </div>
        <div className="rounded-2xl bg-card p-4">
          <TransactionPieChart categories={SAMPLE_CATEGORIES} currency="EUR" />
        </div>
        <div className="grid gap-3">
          <div className="rounded-2xl bg-white/15 p-5 text-white">
            <p className="text-sm text-indigo-100">Total balance</p>
            <p className="mt-2 text-3xl font-semibold">€12,480</p>
          </div>
          <div className="rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Saved this month</p>
            <p className="mt-2 text-3xl font-semibold">€640</p>
            <p className="mt-1 text-xs text-emerald-600">
              ↑ 8% from last month
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
