import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value?: string;
  icon: LucideIcon;
  className?: string;
  children?: ReactNode;
}

export function DashboardCard({
  title,
  value,
  icon: Icon,
  className,
  children,
}: Readonly<DashboardStatCardProps>) {
  return (
    <Card className={cn("h-full min-h-0", className)}>
      <CardHeader className="flex shrink-0 flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardDescription>{title}</CardDescription>
          {value && <CardTitle className="text-2xl">{value}</CardTitle>}
        </div>
        <div className="rounded-lg bg-primary/10 p-2">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col">
        {children ? (
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
