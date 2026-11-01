"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Selection } from "@/components/common/selector/Selection";
import {
  REMINDER_MESSAGE_MAX_LENGTH,
  ReminderFrequency,
  saveImportReminder,
  type ImportReminderSetting,
  type Weekday,
} from "@/lib/models/Notification";
import {
  DAY_OF_MONTH_OPTIONS,
  FREQUENCY_OPTIONS,
  WEEKDAY_OPTIONS,
  browserTimeZone,
  defaultImportReminder,
  isSameSetting,
} from "./utils";

interface ImportReminderCardProps {
  initial: ImportReminderSetting | null;
}

export function ImportReminderCard({ initial }: Readonly<ImportReminderCardProps>) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<ImportReminderSetting>(() => ({
    ...(initial ?? defaultImportReminder()),
    timeZone: browserTimeZone(),
  }));

  // A saved zone other than the browser's counts as a change, so a user who moved can resave.
  const saved = { ...(initial ?? defaultImportReminder()), timeZone: browserTimeZone() };
  const timeZoneChanged = initial !== null && initial.timeZone !== draft.timeZone;
  const dirty = timeZoneChanged || !isSameSetting(draft, saved);

  const updateDraft = (patch: Partial<ImportReminderSetting>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  const onFrequencyChange = (value: string) => {
    const frequency = value as ReminderFrequency;
    updateDraft({
      frequency,
      dayOfWeek: frequency === ReminderFrequency.Weekly ? (draft.dayOfWeek ?? "Monday") : null,
      dayOfMonth: frequency === ReminderFrequency.Monthly ? (draft.dayOfMonth ?? 1) : null,
    });
  };

  const onSave = async () => {
    setSaving(true);
    try {
      const response = await saveImportReminder(draft);
      if (response.error) {
        toast.error(`Failed to save reminder: ${response.error}`);
        return;
      }
      toast.success(draft.enabled ? "Import reminder saved" : "Import reminder turned off");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const messageLength = draft.message?.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1.5">
            <CardTitle>Import reminder</CardTitle>
            <CardDescription>
              A nudge to upload your latest transactions, so your numbers stay current.
            </CardDescription>
          </div>
          <Switch
            checked={draft.enabled}
            onCheckedChange={(checked) => updateDraft({ enabled: checked })}
            aria-label="Enable import reminder"
          />
        </div>
      </CardHeader>
      <CardContent>
        <fieldset disabled={!draft.enabled} className="min-w-0 disabled:opacity-60">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>Repeat</FieldLabel>
                <Selection
                  items={FREQUENCY_OPTIONS}
                  value={draft.frequency}
                  onChange={onFrequencyChange}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="import-reminder-time">Time</FieldLabel>
                <Input
                  id="import-reminder-time"
                  type="time"
                  step={60}
                  value={draft.timeOfDay}
                  onChange={(event) => updateDraft({ timeOfDay: event.target.value })}
                />
              </Field>
            </div>

            {draft.frequency === ReminderFrequency.Weekly && (
              <Field>
                <FieldLabel>On</FieldLabel>
                <Selection
                  items={WEEKDAY_OPTIONS}
                  value={draft.dayOfWeek ?? undefined}
                  onChange={(value) => updateDraft({ dayOfWeek: value as Weekday })}
                />
              </Field>
            )}

            {draft.frequency === ReminderFrequency.Monthly && (
              <Field>
                <FieldLabel>On day</FieldLabel>
                <Selection
                  items={DAY_OF_MONTH_OPTIONS}
                  value={draft.dayOfMonth?.toString()}
                  onChange={(value) => updateDraft({ dayOfMonth: Number(value) })}
                />
                <FieldDescription>Up to the 28th, so it fires every month.</FieldDescription>
              </Field>
            )}

            <p className="text-xs text-muted-foreground">Times are in {draft.timeZone}.</p>

            <Field orientation="horizontal">
              <FieldContent>
                <FieldLabel htmlFor="import-reminder-email">Also send by email</FieldLabel>
                <FieldDescription>
                  We&apos;ll email you as well as showing it in the app.
                </FieldDescription>
              </FieldContent>
              <Switch
                id="import-reminder-email"
                checked={draft.sendEmail}
                onCheckedChange={(checked) => updateDraft({ sendEmail: checked })}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="import-reminder-message">Message (optional)</FieldLabel>
              <Textarea
                id="import-reminder-message"
                maxLength={REMINDER_MESSAGE_MAX_LENGTH}
                placeholder="e.g. Export the bank statement from the Revolut app"
                value={draft.message ?? ""}
                onChange={(event) => updateDraft({ message: event.target.value || null })}
              />
              <p className="text-right text-xs text-muted-foreground">
                {messageLength}/{REMINDER_MESSAGE_MAX_LENGTH}
              </p>
            </Field>
          </FieldGroup>
        </fieldset>
      </CardContent>
      <CardFooter className="justify-end">
        <Button
          disabled={!dirty || saving || draft.timeOfDay === ""}
          onClick={onSave}
        >
          {saving ? "Saving…" : "Save"}
        </Button>
      </CardFooter>
    </Card>
  );
}
