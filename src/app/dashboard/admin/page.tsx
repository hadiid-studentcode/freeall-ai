import Link from "next/link";
import {
  Activity,
  KeyRound,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

import {
  deleteUserAction,
  toggleKeyScopeAction,
  toggleUserRoleAction,
  updatePublicDailyLimitAction,
  updateUserPlanAction,
  createCustomProviderAction,
  deleteCustomProviderAction,
} from "@/app/dashboard/admin/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { requireAdmin } from "@/lib/auth/guard";
import { prisma } from "@/lib/prisma";
import { PLAN_ORDER, PLANS, resolvePlan } from "@/lib/plans";
import { getPublicDailyLimit } from "@/lib/settings";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/utils";

export const metadata = { title: "Admin · FreeAll AI" };

export default async function AdminPage() {
  const admin = await requireAdmin();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    users,
    sharedKeys,
    totalKeys,
    requestsToday,
    successToday,
    demoToday,
    providerBreakdown,
    publicDailyLimit,
    customProviders,
  ] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
        _count: { select: { providerKeys: true, apiKeys: true } },
      },
    }),
    prisma.providerKey.findMany({
      where: { scope: "SHARED" },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        providerName: true,
        keyPreview: true,
        modelName: true,
        isActive: true,
        successCount: true,
        errorCount: true,
        lastUsedAt: true,
        user: { select: { email: true } },
      },
    }),
    prisma.providerKey.count(),
    prisma.requestLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.requestLog.count({
      where: { createdAt: { gte: startOfDay }, success: true },
    }),
    prisma.requestLog.count({
      where: { createdAt: { gte: startOfDay }, source: "demo" },
    }),
    prisma.requestLog.groupBy({
      by: ["providerName"],
      where: { createdAt: { gte: startOfDay } },
      _count: { _all: true },
    }),
    getPublicDailyLimit(),
    prisma.customProvider.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const successRate =
    requestsToday === 0 ? null : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <ShieldCheck className="size-6 text-primary" />
          Admin
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Kelola Provider Publik dan pengguna. Kunci di Provider Publik dipakai
          semua akun terdaftar sekaligus menjadi tenaga untuk demo halaman depan
          yang bisa dicoba pengunjung tanpa mendaftar.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" />}
          label="Pengguna"
          value={formatNumber(users.length)}
          hint={`${users.filter((u) => u.role === "ADMIN").length} admin`}
        />
        <StatCard
          icon={<Share2 className="size-4" />}
          label="Kunci publik"
          value={formatNumber(sharedKeys.filter((k) => k.isActive).length)}
          hint={`dari ${formatNumber(totalKeys)} kunci total`}
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label="Request hari ini"
          value={formatNumber(requestsToday)}
          hint={`${formatNumber(demoToday)} dari demo`}
        />
        <StatCard
          icon={<KeyRound className="size-4" />}
          label="Tingkat sukses"
          value={successRate === null ? "—" : `${successRate}%`}
          hint={
            providerBreakdown.length > 0
              ? providerBreakdown
                  .map((p) => `${p.providerName ?? "?"} ${p._count._all}`)
                  .join(" · ")
              : "belum ada request"
          }
        />
      </div>

      {sharedKeys.filter((k) => k.isActive).length === 0 && (
        <Alert variant="warning">
          <Share2 />
          <AlertDescription>
            Belum ada kunci di Provider Publik, jadi demo halaman depan dan
            pengguna yang belum membawa kunci sendiri akan menerima 503.
            Tambahkan kunci di{" "}
            <Link
              href="/dashboard/providers"
              className="font-medium underline underline-offset-4"
            >
              Provider AI
            </Link>{" "}
            dan centang &quot;Bagikan ke Provider Publik&quot;.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Kuota pengguna tanpa kunci sendiri</CardTitle>
          <CardDescription>
            Pagar harian untuk pengguna yang mengandalkan Provider Publik.
            Begitu mereka menambahkan kunci provider sendiri, pagar ini lepas.
            Isi <strong>0</strong> untuk menutup pemakaian Provider Publik
            sepenuhnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action={updatePublicDailyLimitAction}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="space-y-2">
              <label
                htmlFor="public-limit"
                className="text-sm font-medium text-foreground/90"
              >
                Request per hari
              </label>
              <Input
                id="public-limit"
                name="limit"
                type="number"
                min={0}
                max={100000}
                defaultValue={publicDailyLimit}
                className="w-40"
              />
            </div>
            <Button type="submit">Simpan</Button>
            <p className="text-xs text-muted-foreground">
              Berlaku sejak request berikutnya.
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provider Publik</CardTitle>
          <CardDescription>
            Kunci yang dipakai semua pengguna dan demo halaman depan.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {sharedKeys.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              Belum ada kunci yang dibagikan.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Penyedia</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Pemilik</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sukses / Gagal</TableHead>
                  <TableHead>Terakhir dipakai</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharedKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell>
                      <p className="font-medium capitalize">
                        {key.providerName}
                      </p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {key.keyPreview}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-[12rem]">
                      <p className="truncate font-mono text-xs">
                        {key.modelName ?? "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {key.user?.email ?? "sistem"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.isActive ? "success" : "destructive"}>
                        {key.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      <span className="text-success">
                        ✓ {formatNumber(key.successCount)}
                      </span>{" "}
                      <span className="text-destructive">
                        ✕ {formatNumber(key.errorCount)}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatRelative(key.lastUsedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <form action={toggleKeyScopeAction}>
                        <input type="hidden" name="id" value={key.id} />
                        <Button type="submit" variant="outline" size="sm">
                          Jadikan pribadi
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Katalog penyedia</CardTitle>
          <CardDescription>
            Tambahkan penyedia AI baru tanpa deploy ulang. Yang tersimpan di
            sini langsung muncul di halaman depan, dokumentasi, dan formulir
            pendaftaran kunci. Penyedia bawaan tidak perlu didaftarkan lagi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={createCustomProviderAction}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Input name="slug" placeholder="Slug — mis. novita" required />
            <Input name="label" placeholder="Nama tampilan — Novita AI" required />
            <Select name="format" defaultValue="openai" aria-label="Format API">
              <option value="openai">Format OpenAI</option>
              <option value="gemini">Format Gemini</option>
              <option value="anthropic">Format Anthropic</option>
            </Select>
            <Input
              name="baseUrl"
              placeholder="https://api.novita.ai/v3/openai"
              className="font-mono text-xs"
              required
            />
            <Input
              name="defaultModel"
              placeholder="Model bawaan"
              className="font-mono text-xs"
              required
            />
            <Input name="consoleUrl" placeholder="URL halaman API key (opsional)" />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="free"
                className="size-4 accent-[var(--primary)]"
              />
              Punya tier gratis
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">Tambahkan penyedia</Button>
            </div>
          </form>

          {customProviders.length > 0 && (
            <ul className="divide-y divide-border border-t border-border">
              {customProviders.map((provider) => (
                <li
                  key={provider.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-medium">
                      {provider.label}
                      <Badge variant="outline">{provider.format}</Badge>
                      {provider.free && <Badge variant="success">gratis</Badge>}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {provider.baseUrl} · {provider.defaultModel}
                    </p>
                  </div>
                  <form action={deleteCustomProviderAction}>
                    <input type="hidden" name="id" value={provider.id} />
                    <Button type="submit" variant="ghost" size="icon" title="Hapus">
                      <Trash2 className="text-destructive" />
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengguna</CardTitle>
          <CardDescription>
            {users.length} akun terdaftar. Admin bisa membagikan kunci ke kolam
            bersama; pengguna biasa hanya memakai kunci sendiri dan kolam
            bersama.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Paket</TableHead>
                <TableHead>Kunci provider</TableHead>
                <TableHead>API key</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const isSelf = user.id === admin.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.email}
                      {isSelf && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Anda)
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {user.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "ADMIN" ? "default" : "secondary"}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {/* Selama pembayaran belum otomatis, paket diaktifkan
                          manual di sini setelah konfirmasi. */}
                      <form
                        action={updateUserPlanAction}
                        className="flex items-center gap-1"
                      >
                        <input type="hidden" name="id" value={user.id} />
                        <Select
                          name="plan"
                          defaultValue={resolvePlan(user).id}
                          className="h-8 w-24 px-2 text-xs"
                          aria-label={`Paket ${user.email}`}
                        >
                          {PLAN_ORDER.map((id) => (
                            <option key={id} value={id}>
                              {PLANS[id].label}
                            </option>
                          ))}
                        </Select>
                        <Input
                          name="durationDays"
                          type="number"
                          min={0}
                          max={3650}
                          defaultValue={30}
                          className="h-8 w-16 px-2 text-xs"
                          aria-label="Masa berlaku (hari)"
                          title="Masa berlaku dalam hari; 0 = tanpa batas"
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          Set
                        </Button>
                      </form>
                      {user.planExpiresAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          s/d {formatDateTime(user.planExpiresAt)}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatNumber(user._count.providerKeys)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatNumber(user._count.apiKeys)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {/* Akun sendiri tidak bisa diturunkan atau dihapus —
                            instalasi bisa kehilangan admin terakhirnya. */}
                        {!isSelf && (
                          <>
                            <form action={toggleUserRoleAction}>
                              <input type="hidden" name="id" value={user.id} />
                              <Button type="submit" variant="outline" size="sm">
                                {user.role === "ADMIN"
                                  ? "Jadikan user"
                                  : "Jadikan admin"}
                              </Button>
                            </form>
                            <form action={deleteUserAction}>
                              <input type="hidden" name="id" value={user.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                title="Hapus pengguna beserta seluruh kuncinya"
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            </form>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider">
            {label}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 truncate text-xs text-muted-foreground" title={hint}>
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}
