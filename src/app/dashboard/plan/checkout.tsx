"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, CreditCard, Loader2, Wallet } from "lucide-react";

import {
  startManualOrderAction,
  startMidtransCheckoutAction,
  type CheckoutState,
} from "@/app/dashboard/plan/actions";
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
import { cn } from "@/lib/utils";

/**
 * Satu pilihan yang bisa dibeli, sudah lengkap dengan harganya.
 *
 * Nominalnya dihitung dan diformat di server. Klien hanya menampilkan — kalau
 * harga dihitung di sini, angka yang dilihat pembeli bisa berbeda dari yang
 * ditagih, dan yang paling dipercaya orang justru yang di layar.
 */
export interface Offer {
  plan: string;
  cycle: string;
  planLabel: string;
  priceLabel: string;
  cycleLabel: string;
  savingsLabel: string | null;
  featured: boolean;
}

export interface CheckoutCopy {
  title: string;
  subtitle: string;
  payMidtrans: string;
  payManual: string;
  processing: string;
  sandboxNotice: string;
  yearlyBadge: string;
}

export function Checkout({
  offers,
  copy,
  allowMidtrans,
  allowManual,
  sandbox,
}: {
  offers: Offer[];
  copy: CheckoutCopy;
  allowMidtrans: boolean;
  allowManual: boolean;
  sandbox: boolean;
}) {
  const [selected, setSelected] = useState(
    () => offers.find((offer) => offer.featured) ?? offers[0],
  );

  const [midtransState, midtransAction] = useActionState<
    CheckoutState,
    FormData
  >(startMidtransCheckoutAction, {});
  const [manualState, manualAction] = useActionState<CheckoutState, FormData>(
    startManualOrderAction,
    {},
  );

  // Snap dibuka lewat redirect penuh, bukan popup, supaya CSP tidak perlu
  // mengizinkan skrip dari domain Midtrans. Pengalihan dilakukan di efek
  // karena URL-nya baru diketahui setelah Server Action selesai.
  useEffect(() => {
    if (midtransState.redirectUrl) {
      window.location.href = midtransState.redirectUrl;
    }
  }, [midtransState.redirectUrl]);

  const error = midtransState.error ?? manualState.error;
  const success = manualState.success;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.subtitle}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {offers.map((offer) => {
            const active =
              offer.plan === selected?.plan && offer.cycle === selected?.cycle;

            return (
              <button
                key={`${offer.plan}-${offer.cycle}`}
                type="button"
                onClick={() => setSelected(offer)}
                aria-pressed={active}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{offer.planLabel}</span>
                  {offer.savingsLabel && (
                    <Badge variant="success">{copy.yearlyBadge}</Badge>
                  )}
                </div>
                <p className="mt-2 text-lg font-semibold tabular-nums">
                  {offer.priceLabel}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    {offer.cycleLabel}
                  </span>
                </p>
                {offer.savingsLabel && (
                  <p className="mt-1 text-xs text-success">
                    {offer.savingsLabel}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {sandbox && allowMidtrans && (
          <Alert variant="warning">
            <AlertCircle />
            <AlertDescription>{copy.sandboxNotice}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert variant="success">
            <CheckCircle2 />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-3">
          {allowMidtrans && (
            <form action={midtransAction}>
              <input type="hidden" name="plan" value={selected?.plan ?? ""} />
              <input type="hidden" name="cycle" value={selected?.cycle ?? ""} />
              <PayButton
                label={copy.payMidtrans}
                pendingLabel={copy.processing}
                icon={<CreditCard />}
              />
            </form>
          )}

          {allowManual && (
            <form action={manualAction}>
              <input type="hidden" name="plan" value={selected?.plan ?? ""} />
              <input type="hidden" name="cycle" value={selected?.cycle ?? ""} />
              <PayButton
                label={copy.payManual}
                pendingLabel={copy.processing}
                icon={<Wallet />}
                variant="outline"
              />
            </form>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PayButton({
  label,
  pendingLabel,
  icon,
  variant = "default",
}: {
  label: string;
  pendingLabel: string;
  icon: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : icon}
      {pending ? pendingLabel : label}
    </Button>
  );
}
