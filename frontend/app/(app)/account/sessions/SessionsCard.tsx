"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  revokeOtherSessions,
  revokeSession,
  type Session,
} from "@/lib/models/Session";
import { RevokeOthersDialog } from "./RevokeOthersDialog";
import { SessionRow } from "./SessionRow";

interface SessionsCardProps {
  sessions: Session[];
}

export function SessionsCard({ sessions }: Readonly<SessionsCardProps>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onRevoke = async (id: string) => {
    setBusy(true);
    try {
      const response = await revokeSession(id);
      if (response.error) {
        toast.error(`Failed to log out the device: ${response.error}`);
        return;
      }
      toast.success("Device logged out");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const onRevokeOthers = async () => {
    setBusy(true);
    try {
      const response = await revokeOtherSessions();
      if (response.error) {
        toast.error(`Failed to log out the other devices: ${response.error}`);
        return;
      }
      toast.success("Other devices logged out");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessions</CardTitle>
        <CardDescription>Devices where you are logged in.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        ) : (
          <ul className="divide-y">
            {sessions.map((session) => (
              <SessionRow
                key={session.id}
                session={session}
                busy={busy}
                onRevoke={onRevoke}
              />
            ))}
          </ul>
        )}
        {sessions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <RevokeOthersDialog busy={busy} onRevokeOthers={onRevokeOthers} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
