"use client";

import { useActionState, useId } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2, Plus, TriangleAlert } from "lucide-react";

import { createApiKeyAction, type ActionState } from "@/app/dashboard/actions";
import { CopyButton } from "@/components/copy-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n";

// Hanya string biasa yang boleh menyeberang ke Client Component — fungsi
// pembentuk kalimat (mis. `registered(n)`) tidak bisa diserialisasi React.
type FormCopy = Pick<
  Dictionary["dash"]["apiKeys"],
  | "createTitle"
  | "createHintPre"
  | "name"
  | "namePlaceholder"
  | "dailyQuota"
  | "create"
  | "copyNowTitle"
  | "copyNowBody"
  | "copy"
>;

export function ApiKeyForm({ t }: { t: FormCopy }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createApiKeyAction,
    {},
  );
  const fieldId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.createTitle}</CardTitle>
        <CardDescription>
          {t.createHintPre}{" "}
          <code className="font-mono text-xs">/api/v1/chat</code>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-name`}>{t.name}</Label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              placeholder={t.namePlaceholder}
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-limit`}>{t.dailyQuota}</Label>
            <Input
              id={`${fieldId}-limit`}
              name="dailyLimit"
              type="number"
              min={1}
              max={100000}
              defaultValue={500}
              className="sm:w-32"
            />
          </div>

          <SubmitButton label={t.create} />
        </form>

        {state.error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {state.plaintextKey && (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription className="space-y-3">
              <p className="font-medium">
                {t.copyNowTitle}
              </p>
              <p className="text-xs opacity-90">
                {t.copyNowBody}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-background/60 px-3 py-2 font-mono text-xs">
                  {state.plaintextKey}
                </code>
                <CopyButton value={state.plaintextKey} label={t.copy} />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
      {label}
    </Button>
  );
}
