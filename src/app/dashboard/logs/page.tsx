import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/guard";
import { getTranslations } from "@/lib/i18n";
import { resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatNumber } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.logs.title} · FreeAll AI` };
}

const PAGE_SIZE = 50;

export default async function LogsPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.logs;

  // Log milik API key user ini saja.
  //
  // Trafik demo halaman depan tidak dimiliki siapa pun, dan menampilkannya ke
  // setiap user berarti membocorkan aktivitas pengunjung lain. Karena demo
  // ditenagai Provider Publik yang dikelola admin, log itu hanya ikut tampil
  // untuk admin — yang memang bertanggung jawab atasnya.
  const isAdmin = user.role === "ADMIN";

  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true, role: true },
  });
  const plan = resolvePlan(account);

  // Lama riwayat yang bisa dilihat mengikuti paket. Datanya tetap tersimpan;
  // yang dibatasi hanya jangkauan tampilan.
  const since = new Date();
  since.setDate(since.getDate() - plan.logRetentionDays);

  const logs = await prisma.requestLog.findMany({
    where: {
      createdAt: { gte: since },
      ...(isAdmin
        ? { OR: [{ apiKey: { userId: user.id } }, { source: "demo" }] }
        : { apiKey: { userId: user.id } }),
    },
    orderBy: { createdAt: "desc" },
    take: PAGE_SIZE,
    select: {
      id: true,
      providerName: true,
      modelName: true,
      success: true,
      statusCode: true,
      attempts: true,
      latencyMs: true,
      errorMessage: true,
      source: true,
      createdAt: true,
      apiKey: { select: { name: true } },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {d.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {d.subtitlePre} <strong>{d.subtitleBold}</strong> {d.subtitleMid}{" "}
          {isAdmin ? d.subtitleAdmin : d.subtitleUser}{" "}
          {d.retention(
            isAdmin ? t.dash.plan.adminLabel : t.plans[plan.id].label,
            String(plan.logRetentionDays),
          )}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{d.lastN(PAGE_SIZE)}</CardTitle>
          <CardDescription>
            {logs.length === 0 ? d.none : d.showing(logs.length)}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {logs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              {d.emptyPre}{" "}
              <code className="font-mono text-xs">/api/v1/chat</code>{" "}
              {d.emptyPost}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.colTime}</TableHead>
                  <TableHead>{d.colStatus}</TableHead>
                  <TableHead>{d.colProvider}</TableHead>
                  <TableHead>{d.colModel}</TableHead>
                  <TableHead>{d.colAttempts}</TableHead>
                  <TableHead>{d.colLatency}</TableHead>
                  <TableHead>{d.colSource}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={log.success ? "success" : "destructive"}
                        title={log.errorMessage ?? undefined}
                      >
                        {log.success
                          ? d.success
                          : `${d.failed}${log.statusCode ? ` ${log.statusCode}` : ""}`}
                      </Badge>
                      {!log.success && log.errorMessage && (
                        <p className="mt-1 max-w-[16rem] truncate text-xs text-muted-foreground">
                          {log.errorMessage}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="capitalize">
                      {log.providerName ?? "—"}
                    </TableCell>

                    <TableCell className="max-w-[12rem]">
                      <p className="truncate font-mono text-xs">
                        {log.modelName ?? "—"}
                      </p>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={log.attempts > 1 ? "warning" : "secondary"}
                      >
                        {log.attempts}×
                      </Badge>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {log.latencyMs === null
                        ? "—"
                        : `${formatNumber(log.latencyMs)} ms`}
                    </TableCell>

                    <TableCell className="text-xs">
                      {log.source === "demo" ? (
                        <Badge variant="outline">{d.demo}</Badge>
                      ) : (
                        <span className="text-muted-foreground">
                          {log.apiKey?.name ?? "API"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
