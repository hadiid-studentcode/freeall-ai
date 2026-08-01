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
import { PROVIDER_PRESETS } from "@/lib/ai/providers";

const AUTO = "auto";

export function ProviderForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createProviderKeyAction,
    {},
  );
  const [providerId, setProviderId] = useState(AUTO);
  const fieldId = useId();

  const preset = PROVIDER_PRESETS.find((item) => item.id === providerId);
  const isAuto = providerId === AUTO;
  const isCustom = providerId === "custom";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tambah kunci provider</CardTitle>
        <CardDescription>
          Tempel API key Anda — sistem mengenali penyedianya sendiri, mencari
          model yang masih aktif, lalu mengujinya. Kunci dienkripsi AES-256-GCM
          sebelum disimpan dan tidak pernah ditampilkan ulang secara utuh.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-key`}>API key</Label>
            <Input
              id={`${fieldId}-key`}
              name="key"
              type="password"
              required
              autoComplete="off"
              placeholder="Tempel API key dari penyedia mana pun"
              className="font-mono"
            />
            {isAuto ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wand2 className="size-3 text-primary" />
                Mendukung Groq, Gemini, Claude, OpenRouter, Cerebras, NVIDIA,
                xAI, DeepSeek, Mistral, dan lainnya.
              </p>
            ) : (
              preset?.consoleUrl && (
                <p className="text-xs text-muted-foreground">
                  Ambil kunci di{" "}
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
              <Label htmlFor={`${fieldId}-provider`}>Penyedia</Label>
              <Select
                id={`${fieldId}-provider`}
                name="providerName"
                value={providerId}
                onChange={(event) => setProviderId(event.target.value)}
              >
                <option value={AUTO}>✨ Deteksi otomatis (disarankan)</option>
                {PROVIDER_PRESETS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                    {item.free ? " — ada tier gratis" : ""}
                  </option>
                ))}
              </Select>
              {preset?.note && (
                <p className="text-xs text-muted-foreground">{preset.note}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${fieldId}-priority`}>Prioritas</Label>
              <Input
                id={`${fieldId}-priority`}
                name="priority"
                type="number"
                min={0}
                max={100}
                defaultValue={10}
              />
              <p className="text-xs text-muted-foreground">
                Makin tinggi, makin awal dicoba (0–100).
              </p>
            </div>
          </div>

          {/* Saat deteksi otomatis, Base URL dan model ditentukan sistem. */}
          {!isAuto && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-baseurl`}>
                  Base URL {isCustom ? "" : "(opsional)"}
                </Label>
                <Input
                  id={`${fieldId}-baseurl`}
                  name="baseUrl"
                  // `key` memaksa React memasang ulang input saat penyedia
                  // berganti, supaya defaultValue preset baru benar-benar dipakai.
                  key={`baseurl-${providerId}`}
                  defaultValue={isCustom ? "" : preset?.baseUrl}
                  required={isCustom}
                  placeholder="https://api.contoh.com/v1"
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${fieldId}-model`}>Model (opsional)</Label>
                <Input
                  id={`${fieldId}-model`}
                  name="modelName"
                  key={`model-${providerId}`}
                  defaultValue=""
                  placeholder={
                    preset?.defaultModel || "dipilih otomatis bila dikosongkan"
                  }
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground">
                  Kosongkan agar sistem memilih model aktif dari penyedia.
                </p>
              </div>
            </div>
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
            <SubmitButton />
            {isAuto && (
              <Badge variant="secondary">
                Base URL &amp; model ditentukan otomatis
              </Badge>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
      {pending ? "Mendeteksi & menguji…" : "Tambahkan kunci"}
    </Button>
  );
}
