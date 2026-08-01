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
import { resolvePlan } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const metadata = { title: "Riwayat · FreeAll AI" };

const PAGE_SIZE = 50;

export default async function LogsPage() {
  const user = await requireUser();

  // Log milik API key user ini saja.
  //
  // Trafik demo halaman depan tidak dimiliki siapa pun, dan menampilkannya ke
  // setiap user berarti membocorkan aktivitas pengunjung lain. Karena demo
  // ditenagai Provider Publik yang dikelola admin, log itu hanya ikut tampil
  // untuk admin — yang memang bertanggung jawab atasnya.
  const isAdmin = user.role === "ADMIN";

  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true },
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
          Riwayat request
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Kolom <strong>Percobaan</strong> menunjukkan berapa kombinasi kunci dan
          model yang dilalui sebelum request selesai — angka di atas 1 berarti
          fallback bekerja.{" "}
          {isAdmin
            ? "Sebagai admin, percakapan lewat demo halaman depan ikut tampil dengan tanda Demo."
            : "Hanya request lewat API key Anda yang tampil di sini."}{" "}
          Paket <strong>{plan.label}</strong> menampilkan riwayat{" "}
          {plan.logRetentionDays} hari terakhir.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{PAGE_SIZE} request terakhir</CardTitle>
          <CardDescription>
            {logs.length === 0
              ? "Belum ada request yang tercatat."
              : `Menampilkan ${logs.length} entri terbaru.`}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {logs.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Kirim request pertama ke{" "}
              <code className="font-mono text-xs">/api/v1/chat</code> untuk
              melihat riwayatnya di sini.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Percobaan</TableHead>
                  <TableHead>Latensi</TableHead>
                  <TableHead>Sumber</TableHead>
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
                          ? "Sukses"
                          : `Gagal${log.statusCode ? ` ${log.statusCode}` : ""}`}
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
                        <Badge variant="outline">Demo</Badge>
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
