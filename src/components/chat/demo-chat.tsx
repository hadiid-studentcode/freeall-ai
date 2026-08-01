"use client";

import { useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Turn {
  role: "user" | "assistant";
  content: string;
  meta?: { provider: string; model: string; attempts: number; latencyMs: number };
}

export function DemoChat() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || pending) return;

    const history: Turn[] = [...turns, { role: "user", content: prompt }];
    setTurns(history);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/demo/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error ?? "Gagal menghubungi gateway.");
        return;
      }

      setTurns((current) => [
        ...current,
        {
          role: "assistant",
          content: data.response,
          meta: {
            provider: data.provider,
            model: data.model,
            attempts: data.attempts,
            latencyMs: data.latencyMs,
          },
        },
      ]);
    } catch {
      setError("Jaringan bermasalah. Coba lagi.");
    } finally {
      setPending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="size-4 text-primary" />
        <span className="text-sm font-medium">Coba langsung</span>
        <span className="ml-auto text-xs text-muted-foreground">
          tanpa perlu daftar
        </span>
      </div>

      <div
        ref={scrollRef}
        className="min-h-64 flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin"
      >
        {turns.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Tanyakan apa saja. Gateway akan memilih provider yang tersedia dan
            otomatis pindah kalau ada yang kena limit.
          </p>
        )}

        {turns.map((turn, index) => (
          <div
            key={index}
            className={cn(
              "flex",
              turn.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                turn.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              <p className="whitespace-pre-wrap break-words">{turn.content}</p>
              {turn.meta && (
                <p className="mt-2 text-xs opacity-70">
                  {turn.meta.provider} · {turn.meta.model} ·{" "}
                  {turn.meta.attempts}× percobaan · {turn.meta.latencyMs} ms
                </p>
              )}
            </div>
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Mencari provider yang tersedia…
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            // Enter mengirim, Shift+Enter membuat baris baru.
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send(event);
            }
          }}
          placeholder="Tulis pertanyaan Anda…"
          rows={2}
          maxLength={2000}
          className="min-h-0 resize-none"
          disabled={pending}
        />
        <Button type="submit" size="icon" disabled={pending || !input.trim()}>
          {pending ? <Loader2 className="animate-spin" /> : <Send />}
          <span className="sr-only">Kirim</span>
        </Button>
      </form>
    </div>
  );
}
