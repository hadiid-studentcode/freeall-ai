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

export function ApiKeyForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    createApiKeyAction,
    {},
  );
  const fieldId = useId();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Buat API key baru</CardTitle>
        <CardDescription>
          Kunci ini dipakai aplikasi Anda untuk memanggil{" "}
          <code className="font-mono text-xs">/api/v1/chat</code>.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <form action={formAction} className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-name`}>Nama</Label>
            <Input
              id={`${fieldId}-name`}
              name="name"
              placeholder="mis. Aplikasi Produksi"
              maxLength={60}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-limit`}>Kuota harian</Label>
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

          <SubmitButton />
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
                Salin sekarang — kunci ini tidak akan ditampilkan lagi.
              </p>
              <p className="text-xs opacity-90">
                Database hanya menyimpan hash-nya, jadi kami sendiri tidak bisa
                memulihkannya. Kalau hilang, buat kunci baru.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-background/60 px-3 py-2 font-mono text-xs">
                  {state.plaintextKey}
                </code>
                <CopyButton value={state.plaintextKey} label="Salin" />
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />}
      Buat kunci
    </Button>
  );
}
