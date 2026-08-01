"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

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
import type { AuthFormState } from "@/lib/auth/actions";
import type { Dictionary } from "@/lib/i18n";

interface AuthFormProps {
  mode: "login" | "register";
  t: Dictionary["auth"];
  action: (
    state: AuthFormState,
    formData: FormData,
  ) => Promise<AuthFormState>;
  footer: ReactNode;
}

export function AuthForm({ mode, action, footer, t }: AuthFormProps) {
  const [state, formAction] = useActionState<AuthFormState, FormData>(action, {});
  const isRegister = mode === "register";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          {isRegister ? t.registerTitle : t.loginTitle}
        </CardTitle>
        <CardDescription>
          {isRegister
            ? t.registerSubtitle
            : t.loginSubtitle}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          {isRegister && (
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                placeholder={t.namePlaceholder}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@contoh.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? "new-password" : "current-password"}
              placeholder={isRegister ? t.passwordHint : "••••••••"}
            />
          </div>

          {state.error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <SubmitButton label={isRegister ? t.registerTitle : t.loginTitle} />
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ label }: { label: string }) {
  // useFormStatus harus dipakai di komponen anak dari <form> agar bisa
  // membaca status pengiriman form induknya.
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="animate-spin" />}
      {label}
    </Button>
  );
}
