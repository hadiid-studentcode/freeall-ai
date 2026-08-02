import { Power, Trash2 } from "lucide-react";

import {
  deleteApiKeyAction,
  toggleApiKeyAction,
  updateApiKeyLimitAction,
} from "@/app/dashboard/actions";
import { ApiKeyForm } from "@/app/dashboard/api-keys/api-key-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { prisma } from "@/lib/prisma";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.apiKeys.title} · FreeAll AI` };
}

export default async function ApiKeysPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.apiKeys;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      dailyLimit: true,
      lastUsedAt: true,
      createdAt: true,
      // Hitung pemakaian hari ini langsung di query, agar tidak perlu
      // N+1 query terpisah per kunci.
      _count: { select: { logs: { where: { createdAt: { gte: startOfDay } } } } },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {d.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {d.subtitlePre} <strong>{d.subtitleBold}</strong> {d.subtitlePost}
        </p>
      </header>

      <ApiKeyForm
        t={{
          createTitle: d.createTitle,
          createHintPre: d.createHintPre,
          name: d.name,
          namePlaceholder: d.namePlaceholder,
          dailyQuota: d.dailyQuota,
          create: d.create,
          copyNowTitle: d.copyNowTitle,
          copyNowBody: d.copyNowBody,
          copy: d.copy,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>{d.yourKeys}</CardTitle>
          <CardDescription>
            {apiKeys.length === 0
              ? d.noKeys
              : d.registered(apiKeys.length)}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {apiKeys.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              {d.empty}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.colName}</TableHead>
                  <TableHead>{d.colKey}</TableHead>
                  <TableHead>{d.colStatus}</TableHead>
                  <TableHead>{d.colUsage}</TableHead>
                  <TableHead>{d.colLastUsed}</TableHead>
                  <TableHead>{d.colCreated}</TableHead>
                  <TableHead className="text-right">{d.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((apiKey) => {
                  const used = apiKey._count.logs;
                  const nearLimit = used >= apiKey.dailyLimit * 0.8;

                  return (
                    <TableRow key={apiKey.id}>
                      <TableCell className="font-medium">
                        {apiKey.name}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {apiKey.keyPrefix}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={apiKey.isActive ? "success" : "secondary"}
                        >
                          {apiKey.isActive ? d.active : d.inactive}
                        </Badge>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs ${nearLimit ? "text-warning" : "text-foreground"}`}
                          >
                            {formatNumber(used)}
                          </span>
                          {/* Kuota bisa diubah kapan saja — kebutuhan tiap
                              aplikasi berubah setelah kunci dibuat. */}
                          <form
                            action={updateApiKeyLimitAction}
                            className="flex items-center gap-1"
                          >
                            <input type="hidden" name="id" value={apiKey.id} />
                            <span className="text-xs text-muted-foreground">
                              /
                            </span>
                            <Input
                              name="dailyLimit"
                              type="number"
                              min={1}
                              max={100000}
                              defaultValue={apiKey.dailyLimit}
                              className="h-7 w-20 px-2 text-xs"
                              aria-label={`${d.dailyQuota} ${apiKey.name}`}
                            />
                            <Button type="submit" variant="ghost" size="sm">
                              {d.save}
                            </Button>
                          </form>
                        </div>
                        <div className="mt-1 h-1 w-full max-w-40 overflow-hidden rounded-full bg-secondary">
                          <div
                            className={`h-full ${nearLimit ? "bg-warning" : "bg-primary"}`}
                            style={{
                              width: `${Math.min((used / apiKey.dailyLimit) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatRelative(apiKey.lastUsedAt)}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatDateTime(apiKey.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <form action={toggleApiKeyAction}>
                            <input type="hidden" name="id" value={apiKey.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              title={apiKey.isActive ? d.disable : d.enable}
                            >
                              <Power
                                className={
                                  apiKey.isActive
                                    ? "text-success"
                                    : "text-muted-foreground"
                                }
                              />
                            </Button>
                          </form>

                          <form action={deleteApiKeyAction}>
                            <input type="hidden" name="id" value={apiKey.id} />
                            <Button
                              type="submit"
                              variant="ghost"
                              size="icon"
                              title={d.remove}
                            >
                              <Trash2 className="text-destructive" />
                            </Button>
                          </form>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
