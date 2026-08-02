"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const ui = useUiCopy();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API butuh konteks aman (HTTPS/localhost). Kalau ditolak,
      // biarkan user menyalin manual daripada menampilkan error mengganggu.
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size={label ? "sm" : "icon"}
      onClick={handleCopy}
      className={cn(className)}
      aria-label={copied ? ui.copied : ui.copy}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
      {label ? <span>{copied ? ui.copied : label}</span> : null}
    </Button>
  );
}
