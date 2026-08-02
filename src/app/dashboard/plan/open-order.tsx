"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Clock, ExternalLink, Loader2 } from "lucide-react";

import {
  cancelOrderAction,
  submitManualProofAction,
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
import { Textarea } from "@/components/ui/textarea";

export interface OpenOrder {
  orderId: string;
  planLabel: string;
  amountLabel: string;
  createdLabel: string;
  dueLabel: string | null;
  method: "MIDTRANS" | "MANUAL";
  status: "PENDING" | "AWAITING_REVIEW";
  redirectUrl: string | null;
}

export interface OpenOrderCopy {
  openTitle: string;
  orderId: string;
  amount: string;
  created: string;
  due: string;
  continuePayment: string;
  cancelOrder: string;
  manualHowTo: string;
  noInstructions: string;
  proofLabel: string;
  proofPlaceholder: string;
  proofSubmit: string;
  awaitingReview: string;
  processing: string;
  statusPENDING: string;
  statusAWAITING_REVIEW: string;
}

export function OpenOrderCard({
  order,
  copy,
  manualInstructions,
}: {
  order: OpenOrder;
  copy: OpenOrderCopy;
  manualInstructions: string;
}) {
  const [state, formAction] = useActionState<CheckoutState, FormData>(
    submitManualProofAction,
    {},
  );

  const waiting = order.status === "AWAITING_REVIEW";

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            {copy.openTitle}
          </CardTitle>
          <Badge variant={waiting ? "warning" : "secondary"}>
            {waiting ? copy.statusAWAITING_REVIEW : copy.statusPENDING}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs">
          {copy.orderId}: {order.orderId}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <dl className="grid gap-3 text-sm sm:grid-cols-3">
          <Fact label={order.planLabel} value={order.amountLabel} />
          <Fact label={copy.created} value={order.createdLabel} />
          {order.dueLabel && <Fact label={copy.due} value={order.dueLabel} />}
        </dl>

        {order.method === "MIDTRANS" ? (
          <div className="flex flex-wrap gap-3">
            {order.redirectUrl && (
              <Button asChild>
                {/* Halaman Snap ada di domain Midtrans, jadi dibuka sebagai
                    tautan biasa — bukan lewat router aplikasi ini. */}
                <a
                  href={order.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {copy.continuePayment}
                  <ExternalLink />
                </a>
              </Button>
            )}
            <CancelOwnForm orderId={order.orderId} label={copy.cancelOrder} />
          </div>
        ) : waiting ? (
          <Alert>
            <CheckCircle2 />
            <AlertDescription>{copy.awaitingReview}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {copy.manualHowTo}
              </p>
              {manualInstructions ? (
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {manualInstructions}
                </pre>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {copy.noInstructions}
                </p>
              )}
            </div>

            {state.error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{state.error}</AlertDescription>
              </Alert>
            )}

            <form action={formAction} className="space-y-3">
              <input type="hidden" name="orderId" value={order.orderId} />
              <div className="space-y-2">
                <label
                  htmlFor="payer-note"
                  className="text-sm font-medium text-foreground/90"
                >
                  {copy.proofLabel}
                </label>
                <Textarea
                  id="payer-note"
                  name="payerNote"
                  rows={3}
                  maxLength={500}
                  placeholder={copy.proofPlaceholder}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <SubmitProof
                  label={copy.proofSubmit}
                  pendingLabel={copy.processing}
                />
                <CancelForm orderId={order.orderId} label={copy.cancelOrder} />
              </div>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}

function SubmitProof({
  label,
  pendingLabel,
}: {
  label: string;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}
      {pending ? pendingLabel : label}
    </Button>
  );
}

/**
 * Tombol batal di dalam form keterangan transfer.
 *
 * Form HTML tidak bisa disarangkan, jadi alih-alih membuat form kedua, tombol
 * ini mengalihkan tujuan kirimannya lewat `formAction`. Field `payerNote` ikut
 * terkirim dan diabaikan aksi pembatalan — tidak mengganggu apa pun.
 */
function CancelForm({ orderId, label }: { orderId: string; label: string }) {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      formAction={cancelOrderAction}
      name="orderId"
      value={orderId}
    >
      {label}
    </Button>
  );
}

/** Varian berdiri sendiri, untuk tempat yang tidak punya form induk. */
function CancelOwnForm({ orderId, label }: { orderId: string; label: string }) {
  return (
    <form action={cancelOrderAction}>
      <input type="hidden" name="orderId" value={orderId} />
      <Button type="submit" variant="ghost" size="sm">
        {label}
      </Button>
    </form>
  );
}
