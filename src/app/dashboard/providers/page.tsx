import { Power, RefreshCw, Trash2 } from "lucide-react";

import {
  deleteProviderKeyAction,
  refreshProviderModelsAction,
  toggleProviderKeyAction,
  updateProviderPriorityAction,
} from "@/app/dashboard/actions";
import { toggleKeyScopeAction } from "@/app/dashboard/admin/actions";
import { ProviderForm } from "@/app/dashboard/providers/provider-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getProviderCatalog, toProviderOptions } from "@/lib/ai/catalog";
import { requireUser } from "@/lib/auth/guard";
import { getTranslations } from "@/lib/i18n";
import { describeDisabledReason } from "@/lib/providers/disabled-reason";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatRelative } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.providers.title} · FreeAll AI` };
}

export default async function ProvidersPage() {
  const user = await requireUser();
  const { t } = await getTranslations();
  const d = t.dash.providers;

  const catalog = toProviderOptions(await getProviderCatalog());

  const providerKeys = await prisma.providerKey.findMany({
    where: { userId: user.id },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      providerName: true,
      keyPreview: true,
      modelName: true,
      fallbackModels: true,
      scope: true,
      isActive: true,
      priority: true,
      successCount: true,
      errorCount: true,
      lastUsedAt: true,
      lastError: true,
      disabledReason: true,
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {d.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {d.subtitle}
        </p>
      </header>

      <ProviderForm
        isAdmin={user.role === "ADMIN"}
        presets={catalog}
        t={t.dash.providerForm}
      />

      <Card>
        <CardHeader>
          <CardTitle>{d.registered}</CardTitle>
          <CardDescription>
            {providerKeys.length === 0
              ? d.noKeys
              : d.count(providerKeys.length)}
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 sm:px-6">
          {providerKeys.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              {d.empty}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.colProvider}</TableHead>
                  <TableHead>{d.colModel}</TableHead>
                  <TableHead>{d.colStatus}</TableHead>
                  <TableHead>{d.colPriority}</TableHead>
                  <TableHead>{d.colSuccess}</TableHead>
                  <TableHead>{d.colLastUsed}</TableHead>
                  <TableHead className="text-right">{d.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providerKeys.map((providerKey) => (
                  <TableRow key={providerKey.id}>
                    <TableCell>
                      <p className="font-medium capitalize">
                        {providerKey.providerName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {providerKey.keyPreview}
                      </p>
                    </TableCell>

                    <TableCell className="max-w-[14rem]">
                      <p className="truncate font-mono text-xs">
                        {providerKey.modelName ?? "—"}
                      </p>
                      {providerKey.fallbackModels.length > 0 && (
                        <p
                          className="mt-1 text-xs text-muted-foreground"
                          title={providerKey.fallbackModels.join("\n")}
                        >
                          {d.fallbackModels(providerKey.fallbackModels.length)}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          providerKey.isActive ? "success" : "destructive"
                        }
                      >
                        {providerKey.isActive ? d.active : d.inactive}
                      </Badge>
                      <Badge
                        variant={
                          providerKey.scope === "SHARED" ? "default" : "outline"
                        }
                        className="mt-1 block w-fit"
                        title={
                          providerKey.scope === "SHARED"
                            ? d.publicTitle
                            : d.privateTitle
                        }
                      >
                        {providerKey.scope === "SHARED" ? d.public : d.private}
                      </Badge>
                      {/* Admin bisa memindahkan kunci yang SUDAH terdaftar
                          masuk atau keluar dari Provider Publik, tanpa perlu
                          menghapus lalu mendaftarkannya ulang. */}
                      {user.role === "ADMIN" && (
                        <form action={toggleKeyScopeAction} className="mt-1">
                          <input
                            type="hidden"
                            name="id"
                            value={providerKey.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-xs"
                          >
                            {providerKey.scope === "SHARED"
                              ? d.makePrivate
                              : d.makePublic}
                          </Button>
                        </form>
                      )}
                      {!providerKey.isActive && providerKey.disabledReason && (
                        <p className="mt-1 max-w-[12rem] text-xs text-muted-foreground">
                          {describeDisabledReason(
                            providerKey.disabledReason,
                            t.errors.provider,
                          )}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      {/* Form tersendiri agar prioritas bisa diubah tanpa JavaScript. */}
                      <form
                        action={updateProviderPriorityAction}
                        className="flex items-center gap-1"
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={providerKey.id}
                        />
                        <Input
                          name="priority"
                          type="number"
                          min={0}
                          max={100}
                          defaultValue={providerKey.priority}
                          className="h-8 w-16 px-2 text-xs"
                          aria-label={`${d.colPriority} ${providerKey.providerName}`}
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          {d.save}
                        </Button>
                      </form>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs">
                      <span className="text-success">
                        ✓ {formatNumber(providerKey.successCount)}
                      </span>{" "}
                      <span className="text-destructive">
                        ✕ {formatNumber(providerKey.errorCount)}
                      </span>
                      {providerKey.lastError && (
                        <p className="mt-1 max-w-[14rem] truncate text-muted-foreground">
                          {providerKey.lastError}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelative(providerKey.lastUsedAt)}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <form action={refreshProviderModelsAction}>
                          <input
                            type="hidden"
                            name="id"
                            value={providerKey.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            title={d.refresh}
                          >
                            <RefreshCw />
                          </Button>
                        </form>

                        <form action={toggleProviderKeyAction}>
                          <input
                            type="hidden"
                            name="id"
                            value={providerKey.id}
                          />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            title={providerKey.isActive ? d.disable : d.enable}
                          >
                            <Power
                              className={
                                providerKey.isActive
                                  ? "text-success"
                                  : "text-muted-foreground"
                              }
                            />
                          </Button>
                        </form>

                        <form action={deleteProviderKeyAction}>
                          <input
                            type="hidden"
                            name="id"
                            value={providerKey.id}
                          />
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
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
