"use client";

import { useActionState, useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2, Plus, Wand2 } from "lucide-react";

import { createProviderKeyAction, type ActionState } from "@/app/dashboard/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import { Select } from "@/components/ui/select";
import type { ProviderOption } from "@/lib/ai/catalog";
import type { Dictionary } from "@/lib/i18n";

const AUTO = "auto";

export function ProviderForm({
  isAdmin,
  presets,
  t,
}: {
  isAdmin: boolean;
  presets: ProviderOption[];
  t: Dictionary["dash"]["providerForm"];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createProviderKeyAction,
    {},
  );
  const [providerId, setProviderId] = useState(AUTO);
  const fieldId = useId();

  const preset = presets.find((item) => item.id === providerId);
  const isAuto = providerId === AUTO;
  const isCustom = providerId === "custom";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>
          {t.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-key`}>{t.apiKey}</Label>
            <Input
              id={`${fieldId}-key`}
              name="key"
              type="password"
              required
              autoComplete="off"
              placeholder={t.apiKeyPlaceholder}
              className="font-mono"
            />
            {isAuto ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wand2 className="size-3 text-primary" />
                {t.autoHint}
              </p>
            ) : (
              preset?.consoleUrl && (
                <p className="text-xs text-muted-foreground">
                  {t.getKeyAt}{" "}
                  <a
                    href={preset.consoleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {new URL(preset.consoleUrl).host}
                  </a>
                </p>
              )
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-provider`}>{t.provider}</Label>
              <Select
                id={`${fieldId}-provider`}
                name="providerName"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
              >
                <option value={AUTO}>{t.autoOption}</option>
                {presets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {item.free ? t.freeTier : ""}
                  </option>
                ))}
              </Select>
              {preset?.note && (
                <p className="text-xs text-muted-foreground">{preset.note}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-priority`}>{t.priority}</Label>
              <Input
                id={`${fieldId}-priority`}
                name="priority"
                type="number"
                min={0}
                max={100}
                defaultValue={10}
              />
              <p className="text-xs text-muted-foreground">
                {t.priorityHint}
              </p>
            </div>
          </div>

          {/* Saat deteksi otomatis, Base URL dan model ditentukan sistem. */}
          {!isAuto && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-baseurl`}>
                  {t.baseUrl} {isCustom ? "" : t.optional}
                </Label>
                <Input
                  id={`${fieldId}-baseurl`}
                  name="baseUrl"
                  // `key` memaksa React memasang ulang input saat penyedia
                  // berganti, supaya defaultValue preset baru benar-benar dipakai.
                  key={`baseurl-${providerId}`}
                  defaultValue={isCustom ? "" : preset?.baseUrl}
                  required={isCustom}
                  placeholder={t.baseUrlPlaceholder}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-model`}>{t.model}</Label>
                <Input
                  id={`${fieldId}-model`}
                  name="modelName"
                  key={`model-${providerId}`}
                  defaultValue=""
                  placeholder={
                    preset?.defaultModel || t.modelPlaceholder
                  }
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  {t.modelHint}
                </p>
              </div>
            </div>
          )}

          {isAdmin && (
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/40 p-3">
              <input
                type="checkbox"
                name="scope"
                value="SHARED"
                defaultChecked
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span className="text-sm">
                <span className="font-medium">{t.shareTitle}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t.shareBody}
                </span>
              </span>
            </label>
          )}

          {state.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state.success && (
            <Alert variant="success">
              <CheckCircle2 />
              <AlertDescription>{state.success}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton label={t.submit} pendingLabel={t.submitting} />
            {isAuto && (
              <Badge variant="secondary">
                {t.autoBadge}
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
      {pending ? pendingLabel : label}
    </Button>
  );
}
