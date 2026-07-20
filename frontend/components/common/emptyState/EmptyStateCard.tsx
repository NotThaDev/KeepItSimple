import type { ComponentType } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Divider } from "../Divider";

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionText: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: ComponentType<{ className?: string }>;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  actionText,
  onAction,
  actionHref,
  icon: Icon = Inbox,
  className,
}: EmptyStateCardProps) {
  const isActionDisabled = !actionHref && !onAction;

  const actionButton = (
    <Button
      size="lg"
      className="w-full sm:w-auto sm:min-w-44"
      onClick={onAction}
      disabled={isActionDisabled}
    >
      {actionText}
    </Button>
  );

  return (
    <Card
      className={cn(
        "border-border/70 relative w-full max-w-sm self-center overflow-hidden border",
        "bg-gradient-to-b from-muted/20 via-card to-card",
        "shadow-sm",
        "m-auto",
        className,
      )}
    >
      <CardHeader className="mt-2 flex items-center justify-center px-6 sm:px-8">
        <div className="bg-primary/10 text-primary relative inline-flex size-32 items-center justify-center rounded-sm ring-1 ring-primary/20">
          <div className="bg-primary/8 absolute size-24 -rotate-6 rounded-sm border border-primary/25" />
          <div className="bg-primary/15 absolute size-16 rotate-45 rounded-sm border border-primary/30 shadow-sm" />
          <Icon className="relative z-10 size-8" />
        </div>
      </CardHeader>

      <Divider className="w-[90%] m-auto mt-3" />

      <CardContent className="px-6 pb-2 text-center sm:px-8 mt-3">
        <div className="mx-auto max-w-xl space-y-2">
          <CardTitle className="text-xl sm:text-2xl">{title}</CardTitle>
          <CardDescription className="text-sm leading-relaxed sm:text-base">
            {description}
          </CardDescription>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t px-6 mt-3 pt-0 sm:px-8 bg-transparent border-t-0">
        {actionHref ? (
          <Button asChild size="lg" className="w-full sm:w-auto sm:min-w-44">
            <Link href={actionHref}>{actionText}</Link>
          </Button>
        ) : (
          actionButton
        )}
      </CardFooter>
    </Card>
  );
}
