"use client";

import { useState } from "react";
import { Loader2, Send, TriangleAlert } from "lucide-react";

import { CopyButton } from "@/components/copy-button";
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
import { Textarea } from "@/components/ui/textarea";
import type { Dictionary } from "@/lib/i18n";

interface RunResult {
  status: number;
  latencyMs: number;
  body: string;
}

export function PlaygroundClient({
  providers,
  t,
}: {
  providers: string[];
  t: Dictionary["dash"]["playground"];
}) {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState(t.promptDefault);
  const [provider, setProvider] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const endpoint = "/api/v1/chat";

  async function run(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;

    if (!apiKey.trim()) {
      setError(t.needKey);
      return;
    }

    setError(null);
    setResult(null);
    setPending(true);

    const startedAt = performance.now();
    try {
      // Sengaja memanggil endpoint publik yang sama persis dengan yang dipakai
      // aplikasi luar — termasuk header Authorization — supaya yang diuji di
      // sini benar-benar jalur produksinya, bukan jalan pintas internal.
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          prompt,
          ...(provider ? { provider } : {}),
        }),
      });

      const text = await response.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        // Bukan JSON — tampilkan apa adanya.
      }

      setResult({
        status: response.status,
        latencyMs: Math.round(performance.now() - startedAt),
        body: pretty,
      });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t.sendFailed,
      );
    } finally {
      setPending(false);
    }
  }

  const curl = `curl -X POST ${endpoint} \\
  -H "Authorization: Bearer ${apiKey.trim() || "sk-freeall-xxxxx"}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ prompt, ...(provider ? { provider } : {}) })}'`;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t.requestTitle}</CardTitle>
          <CardDescription>
            {t.requestHintPre}{" "}
            <code className="font-mono text-xs">POST {endpoint}</code>{" "}
            {t.requestHintPost}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={run} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pg-key">{t.apiKeyLabel}</Label>
              <Input
                id="pg-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="sk-freeall-…"
                className="font-mono text-xs"
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                {t.apiKeyHint}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg-prompt">{t.promptLabel}</Label>
              <Textarea
                id="pg-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                maxLength={4000}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pg-provider">{t.forceProvider}</Label>
              <Select
                id="pg-provider"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
              >
                <option value="">{t.auto}</option>
                {providers.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </Select>
              <p className="text-xs text-muted-foreground">
                {t.forceHint}
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <Send />}
              {pending ? t.sending : t.send}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{t.responseTitle}</CardTitle>
              <CardDescription>
                {result
                  ? t.doneIn.replace("{n}", String(result.latencyMs))
                  : t.notSent}
              </CardDescription>
            </div>
            {result && (
              <Badge
                variant={
                  result.status >= 200 && result.status < 300
                    ? "success"
                    : result.status === 429
                      ? "warning"
                      : "destructive"
                }
              >
                HTTP {result.status}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {result ? (
              <pre className="max-h-96 overflow-auto rounded-lg bg-background/60 p-4 text-xs leading-relaxed scrollbar-thin">
                <code className="font-mono">{result.body}</code>
              </pre>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t.placeholder}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
            <div className="space-y-1.5">
              <CardTitle className="text-base">{t.curlTitle}</CardTitle>
              <CardDescription>
                {t.curlHint}
              </CardDescription>
            </div>
            <CopyButton value={curl} />
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg bg-background/60 p-4 text-xs leading-relaxed scrollbar-thin">
              <code className="font-mono">{curl}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
