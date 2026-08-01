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
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatNumber } from "@/lib/utils";

export const metadata = { title: "Riwayat · FreeAll AI" };

const PAGE_SIZE = 50;

export default async function LogsPage() {
  const user = await requireUser();

  // Hanya log milik API key user ini — log demo (apiKeyId null) tidak ikut.
  const logs = await prisma.requestLog.findMany({
    where: { apiKey: { userId: user.id } },
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
          Kolom <strong>Percobaan</strong> menunjukkan berapa kunci provider yang
          dilalui sebelum request selesai — angka di atas 1 berarti fallback
          bekerja.
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
                  <TableHead>API key</TableHead>
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

                    <TableCell className="text-xs text-muted-foreground">
                      {log.apiKey?.name ?? "—"}
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
