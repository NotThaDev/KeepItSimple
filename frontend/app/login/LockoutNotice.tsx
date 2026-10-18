"use client";

import { useEffect, useState } from "react";
import { LockKeyhole } from "lucide-react";
import { formatCountdown } from "./utils";

interface LockoutNoticeProps {
  // Epoch milliseconds when the lockout ends.
  until: number;
  onExpire: () => void;
}

export function LockoutNotice({
  until,
  onExpire,
}: Readonly<LockoutNoticeProps>) {
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((until - now) / 1000));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) onExpire();
  }, [secondsLeft, onExpire]);

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
    >
      <LockKeyhole className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        Your account is locked after too many failed attempts. Try again in{" "}
        {/* Screen readers get the message once; a ticking timer would be re-read every second. */}
        <span aria-hidden className="font-semibold tabular-nums">
          {formatCountdown(secondsLeft)}
        </span>
        <span className="sr-only">{Math.ceil(secondsLeft / 60)} minutes</span>.
      </p>
    </div>
  );
}
