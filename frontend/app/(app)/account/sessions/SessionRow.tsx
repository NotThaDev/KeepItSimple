"use client";

import { Laptop, LogOut, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { describeUserAgent, isMobileUserAgent } from "@/lib/helpers/userAgent";
import type { Session } from "@/lib/models/Session";

// With the time: "last used" on the same day is the common case.
const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

interface SessionRowProps {
  session: Session;
  busy: boolean;
  onRevoke: (id: string) => Promise<void>;
}

export function SessionRow({
  session,
  busy,
  onRevoke,
}: Readonly<SessionRowProps>) {
  const Icon = isMobileUserAgent(session.userAgent) ? Smartphone : Laptop;

  return (
    <li className="flex items-center gap-3 py-3">
      <Icon className="size-5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">
            {describeUserAgent(session.userAgent)}
          </span>
          {session.current && <Badge variant="secondary">This device</Badge>}
        </div>
        {/* The server may render another time zone than the browser. */}
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>
          Last used {DATE_TIME_FORMATTER.format(session.lastUsedAt)} · Signed
          in {DATE_TIME_FORMATTER.format(session.createdAt)}
        </p>
      </div>
      {!session.current && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => onRevoke(session.id)}
        >
          <LogOut />
          Log out
        </Button>
      )}
    </li>
  );
}
