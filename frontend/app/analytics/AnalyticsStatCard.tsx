"use client";

import { DashboardCard } from "@/app/dashboard/cards/DashboardCard";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

export interface AnalyticsStatCardProps {
  title: string;
  icon: LucideIcon;
  value: string;
  description?: string;
  delta?: {
    formatted: string;
    isUp: boolean;
    upIsGood?: boolean;
  };
}

export function AnalyticsStatCard({
  title,
  icon,
  value,
  description,
  delta,
}: Readonly<AnalyticsStatCardProps>) {
  const isGood = delta ? (delta.upIsGood ?? true) === delta.isUp : false;

  return (
    <DashboardCard title={title} icon={icon}>
      <p className="text-3xl font-semibold">{value}</p>
      {delta ? (
        <div
          className={`mt-1 flex items-center gap-1 ${
            isGood ? "text-green-500" : "text-red-500"
          }`}
        >
          {delta.isUp ? (
            <ArrowUpRight className="h-4 w-4" />
          ) : (
            <ArrowDownRight className="h-4 w-4" />
          )}
          <p className="text-sm">{delta.formatted} vs last month</p>
        </div>
      ) : description ? (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </DashboardCard>
  );
}

export function AnalyticsStatRow({
  items,
}: Readonly<{ items: AnalyticsStatCardProps[] }>) {
  return (
    <div className="grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <AnalyticsStatCard key={item.title} {...item} />
      ))}
    </div>
  );
}
