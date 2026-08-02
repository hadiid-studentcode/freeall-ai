import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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

/**
 * Riwayat pembayaran.
 *
 * Server Component: tidak ada interaksi di sini, jadi tabelnya tidak perlu
 * ikut ke bundel klien. Nilainya sudah diformat pemanggil supaya format tanggal
 * dan mata uang tetap satu sumber dengan halaman lain.
 */

export interface PaymentRow {
  id: string;
  orderId: string;
  date: string;
  planLabel: string;
  amountLabel: string;
  methodLabel: string;
  statusLabel: string;
  status: "PENDING" | "AWAITING_REVIEW" | "PAID" | "FAILED" | "EXPIRED" | "CANCELLED";
}

export interface HistoryCopy {
  historyTitle: string;
  historyEmpty: string;
  colDate: string;
  colPlan: string;
  colAmount: string;
  colMethod: string;
  colStatus: string;
  orderId: string;
}

const STATUS_VARIANT = {
  PAID: "success",
  PENDING: "secondary",
  AWAITING_REVIEW: "warning",
  FAILED: "destructive",
  EXPIRED: "outline",
  CANCELLED: "outline",
} as const;

export function PaymentHistory({
  rows,
  copy,
}: {
  rows: PaymentRow[];
  copy: HistoryCopy;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.historyTitle}</CardTitle>
      </CardHeader>

      <CardContent className="px-0 sm:px-6">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
            {copy.historyEmpty}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{copy.colDate}</TableHead>
                <TableHead>{copy.colPlan}</TableHead>
                <TableHead>{copy.colAmount}</TableHead>
                <TableHead>{copy.colMethod}</TableHead>
                <TableHead>{copy.colStatus}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {row.date}
                    <span className="mt-0.5 block font-mono">
                      {row.orderId}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{row.planLabel}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">
                    {row.amountLabel}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {row.methodLabel}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[row.status]}>
                      {row.statusLabel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
