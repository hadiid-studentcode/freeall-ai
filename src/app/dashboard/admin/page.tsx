import Link from "next/link";
import {
  Activity,
  KeyRound,
  Share2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Users,
} from "lucide-react";

import {
  approveManualPaymentAction,
  clearMidtransCredentialsAction,
  deleteUserAction,
  rejectManualPaymentAction,
  saveMidtransCredentialsAction,
  toggleKeyScopeAction,
  updateDemoGlobalLimitAction,
  updateDemoIpLimitsAction,
  updateManualInstructionsAction,
  updatePaymentModeAction,
  toggleUserRoleAction,
  updatePublicDailyLimitAction,
  updateUserPlanAction,
  createCustomProviderAction,
  deleteCustomProviderAction,
} from "@/app/dashboard/admin/actions";
import { Textarea } from "@/components/ui/textarea";
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
import { getTranslations } from "@/lib/i18n";
import {
  getManualInstructions,
  getMidtransStatus,
  getPaymentMode,
  PAYMENT_MODES,
} from "@/lib/payments/config";
import { formatPrice } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { PLAN_ORDER, resolvePlan } from "@/lib/plans";
import { headers } from "next/headers";
import {
  getDemoGlobalDailyLimit,
  getDemoIpLimits,
  getPublicDailyLimit,
} from "@/lib/settings";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/utils";

export async function generateMetadata() {
  const { t } = await getTranslations();
  return { title: `${t.dash.admin.title} · FreeAll AI` };
}

export default async function AdminPage() {
  const admin = await requireAdmin();
  const { t } = await getTranslations();
  const d = t.dash.admin;

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

  const [
    paymentMode,
    midtrans,
    manualInstructions,
    demoIpLimits,
    demoGlobalLimit,
    pendingPayments,
    headerBag,
  ] = await Promise.all([
      getPaymentMode(),
      getMidtransStatus(),
      getManualInstructions(),
      getDemoIpLimits(),
      getDemoGlobalDailyLimit(),
      // Antrean kerja admin: tagihan manual yang menunggu keputusan manusia.
      prisma.payment.findMany({
        where: { method: "MANUAL", status: { in: ["AWAITING_REVIEW", "PENDING"] } },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          orderId: true,
          plan: true,
          amount: true,
          status: true,
          payerNote: true,
          createdAt: true,
          user: { select: { email: true } },
        },
      }),
      headers(),
    ]);

  // Alamat webhook harus absolut dan menunjuk instance ini, karena Midtrans
  // memanggilnya dari luar. APP_URL menang bila diisi — di belakang proxy,
  // header host belum tentu alamat publik yang sebenarnya.
  const origin =
    process.env.APP_URL?.trim().replace(/\/$/, "") ??
    `${headerBag.get("x-forwarded-proto") ?? "http"}://${
      headerBag.get("x-forwarded-host") ?? headerBag.get("host") ?? "localhost:3000"
    }`;
  const webhookUrl = `${origin}/api/payments/midtrans/notification`;

  const successRate =
    requestsToday === 0 ? null : Math.round((successToday / requestsToday) * 100);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          <ShieldCheck className="size-6 text-primary" />
          {d.title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {d.subtitle}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="size-4" />}
          label={d.statUsers}
          value={formatNumber(users.length)}
          hint={d.statUsersHint(
            users.filter((u) => u.role === "ADMIN").length,
          )}
        />
        <StatCard
          icon={<Share2 className="size-4" />}
          label={d.statPublicKeys}
          value={formatNumber(sharedKeys.filter((k) => k.isActive).length)}
          hint={d.statPublicKeysHint(formatNumber(totalKeys))}
        />
        <StatCard
          icon={<Activity className="size-4" />}
          label={d.statRequests}
          value={formatNumber(requestsToday)}
          hint={d.statRequestsHint(formatNumber(demoToday))}
        />
        <StatCard
          icon={<KeyRound className="size-4" />}
          label={d.statSuccess}
          value={successRate === null ? "—" : `${successRate}%`}
          hint={
            providerBreakdown.length > 0
              ? providerBreakdown
                  .map((p) => `${p.providerName ?? "?"} ${p._count._all}`)
                  .join(" · ")
              : d.statSuccessNone
          }
        />
      </div>

      {sharedKeys.filter((k) => k.isActive).length === 0 && (
        <Alert variant="warning">
          <Share2 />
          <AlertDescription>
            {d.emptyPoolPre}{" "}
            <Link
              href="/dashboard/providers"
              className="font-medium underline underline-offset-4"
            >
              {d.emptyPoolCta}
            </Link>{" "}
            {d.emptyPoolPost}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{d.quotaTitle}</CardTitle>
          <CardDescription>
            {d.quotaDescPre} <strong>0</strong> {d.quotaDescPost}
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
                {d.quotaField}
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
            <Button type="submit">{d.save}</Button>
            <p className="text-xs text-muted-foreground">
              {d.quotaNote}
            </p>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{d.demoTitle}</CardTitle>
          <CardDescription>{d.demoDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <form
            action={updateDemoIpLimitsAction}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="space-y-2">
              <label
                htmlFor="demo-hour"
                className="text-sm font-medium text-foreground/90"
              >
                {d.demoPerHour}
              </label>
              <Input
                id="demo-hour"
                name="perHour"
                type="number"
                min={0}
                max={100000}
                defaultValue={demoIpLimits.perHour}
                className="w-32"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="demo-day"
                className="text-sm font-medium text-foreground/90"
              >
                {d.demoPerDay}
              </label>
              <Input
                id="demo-day"
                name="perDay"
                type="number"
                min={0}
                max={100000}
                defaultValue={demoIpLimits.perDay}
                className="w-32"
              />
            </div>
            <Button type="submit">{d.save}</Button>
          </form>

          <form
            action={updateDemoGlobalLimitAction}
            className="flex flex-wrap items-end gap-3 border-t border-border pt-5"
          >
            <div className="space-y-2">
              <label
                htmlFor="demo-global"
                className="text-sm font-medium text-foreground/90"
              >
                {d.demoGlobal}
              </label>
              <Input
                id="demo-global"
                name="limit"
                type="number"
                min={0}
                max={1000000}
                defaultValue={demoGlobalLimit}
                className="w-40"
              />
            </div>
            <Button type="submit" variant="outline">
              {d.save}
            </Button>
            <p className="max-w-md text-xs text-muted-foreground">
              {d.demoGlobalHint}
            </p>
          </form>

          <p className="text-xs text-muted-foreground">{d.demoNote}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{d.paymentTitle}</CardTitle>
          <CardDescription>{d.paymentDesc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={updatePaymentModeAction}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="space-y-2">
              <label
                htmlFor="payment-mode"
                className="text-sm font-medium text-foreground/90"
              >
                {d.modeLabel}
              </label>
              <Select
                id="payment-mode"
                name="mode"
                defaultValue={paymentMode}
                className="w-72"
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {d[`mode${mode}`]}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit">{d.save}</Button>
          </form>

          {/* Memilih Midtrans tanpa kredensial hanya menghasilkan tombol yang
              gagal saat diklik, jadi keadaannya dikatakan terus terang. */}
          {(paymentMode === "MIDTRANS" || paymentMode === "BOTH") &&
            !midtrans.configured && (
              <Alert variant="warning">
                <TriangleAlert />
                <AlertDescription>{d.modeNotReady}</AlertDescription>
              </Alert>
            )}

          <form action={updateManualInstructionsAction} className="space-y-2">
            <label
              htmlFor="manual-instructions"
              className="text-sm font-medium text-foreground/90"
            >
              {d.instructionsLabel}
            </label>
            <Textarea
              id="manual-instructions"
              name="instructions"
              rows={4}
              maxLength={1000}
              defaultValue={manualInstructions}
              placeholder={d.instructionsPlaceholder}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="outline" size="sm">
                {d.save}
              </Button>
              <p className="text-xs text-muted-foreground">
                {d.instructionsHint}
              </p>
            </div>
          </form>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{d.midtransTitle}</h3>
              {midtrans.configured && (
                <Badge variant={midtrans.isProduction ? "default" : "warning"}>
                  {midtrans.isProduction
                    ? d.productionBadge
                    : d.sandboxBadge}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              {!midtrans.configured
                ? d.midtransMissing
                : midtrans.source === "env"
                  ? d.midtransFromEnv
                  : d.midtransFromDb}
            </p>

            {midtrans.configured && (
              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">{d.serverKey}</dt>
                  <dd className="font-mono">{midtrans.serverKeyPreview}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{d.clientKey}</dt>
                  <dd className="break-all font-mono">{midtrans.clientKey}</dd>
                </div>
              </dl>
            )}

            {midtrans.source !== "env" && (
              <form
                action={saveMidtransCredentialsAction}
                className="grid gap-3 sm:grid-cols-2"
              >
                <Input
                  name="serverKey"
                  type="password"
                  autoComplete="off"
                  placeholder={d.serverKey}
                  className="font-mono text-xs"
                  required
                />
                <Input
                  name="clientKey"
                  placeholder={d.clientKey}
                  className="font-mono text-xs"
                  required
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isProduction"
                    defaultChecked={midtrans.isProduction}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {d.production}
                </label>
                <div className="flex flex-wrap gap-2 sm:col-span-2">
                  <Button type="submit" size="sm">
                    {d.saveCredentials}
                  </Button>
                  {midtrans.source === "database" && (
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      formAction={clearMidtransCredentialsAction}
                    >
                      {d.clearCredentials}
                    </Button>
                  )}
                </div>
              </form>
            )}

            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {d.webhookTitle}
              </p>
              <code className="mt-2 block break-all font-mono text-xs">
                {webhookUrl}
              </code>
              <p className="mt-2 text-xs text-muted-foreground">
                {d.webhookHint}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{d.queueTitle}</CardTitle>
          <CardDescription>{d.queueDesc}</CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {pendingPayments.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              {d.queueEmpty}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.queueColUser}</TableHead>
                  <TableHead>{d.queueColOrder}</TableHead>
                  <TableHead>{d.queueColPlan}</TableHead>
                  <TableHead>{d.queueColAmount}</TableHead>
                  <TableHead>{d.queueColNote}</TableHead>
                  <TableHead>{d.queueColCreated}</TableHead>
                  <TableHead className="text-right">{d.colActions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-sm">
                      {payment.user.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.orderId}
                    </TableCell>
                    <TableCell>{t.plans[payment.plan].label}</TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums">
                      {formatPrice(payment.amount)}
                    </TableCell>
                    <TableCell className="max-w-[16rem] text-xs text-muted-foreground">
                      {payment.payerNote ?? "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatDateTime(payment.createdAt)}
                    </TableCell>
                    <TableCell>
                      {/* Satu form, dua tujuan: tombol tolak mengalihkan
                          kirimannya lewat formAction sehingga catatan admin
                          ikut terbawa pada kedua keputusan. */}
                      <form className="flex flex-wrap items-center justify-end gap-2">
                        <input
                          type="hidden"
                          name="orderId"
                          value={payment.orderId}
                        />
                        <Input
                          name="adminNote"
                          placeholder={d.adminNotePlaceholder}
                          className="h-8 w-40 px-2 text-xs"
                        />
                        <Button
                          type="submit"
                          size="sm"
                          formAction={approveManualPaymentAction}
                        >
                          {d.approve}
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          variant="ghost"
                          formAction={rejectManualPaymentAction}
                        >
                          {d.reject}
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
          <CardTitle>{d.poolTitle}</CardTitle>
          <CardDescription>
            {d.poolDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          {sharedKeys.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground sm:px-0">
              {d.poolEmpty}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{d.colProvider}</TableHead>
                  <TableHead>{d.colModel}</TableHead>
                  <TableHead>{d.colOwner}</TableHead>
                  <TableHead>{d.colStatus}</TableHead>
                  <TableHead>{d.colSuccess}</TableHead>
                  <TableHead>{d.colLastUsed}</TableHead>
                  <TableHead className="text-right">{d.colActions}</TableHead>
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
                      {key.user?.email ?? d.system}
                    </TableCell>
                    <TableCell>
                      <Badge variant={key.isActive ? "success" : "destructive"}>
                        {key.isActive ? d.active : d.inactive}
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
                          {d.makePrivate}
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
          <CardTitle>{d.catalogTitle}</CardTitle>
          <CardDescription>
            {d.catalogDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form
            action={createCustomProviderAction}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Input name="slug" placeholder={d.catalogSlug} required />
            <Input name="label" placeholder={d.catalogLabel} required />
            <Select
              name="format"
              defaultValue="openai"
              aria-label={d.catalogFormat}
            >
              <option value="openai">{d.catalogFormatOpenai}</option>
              <option value="gemini">{d.catalogFormatGemini}</option>
              <option value="anthropic">{d.catalogFormatAnthropic}</option>
            </Select>
            <Input
              name="baseUrl"
              placeholder="https://api.novita.ai/v3/openai"
              className="font-mono text-xs"
              required
            />
            <Input
              name="defaultModel"
              placeholder={d.catalogModel}
              className="font-mono text-xs"
              required
            />
            <Input name="consoleUrl" placeholder={d.catalogConsole} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="free"
                className="size-4 accent-[var(--primary)]"
              />
              {d.catalogFree}
            </label>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit">{d.catalogSubmit}</Button>
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
                      {provider.free && (
                        <Badge variant="success">{d.catalogFreeBadge}</Badge>
                      )}
                    </p>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {provider.baseUrl} · {provider.defaultModel}
                    </p>
                  </div>
                  <form action={deleteCustomProviderAction}>
                    <input type="hidden" name="id" value={provider.id} />
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon"
                      title={d.remove}
                    >
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
          <CardTitle>{d.usersTitle}</CardTitle>
          <CardDescription>
            {d.usersDesc(users.length)}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{d.colEmail}</TableHead>
                <TableHead>{d.colName}</TableHead>
                <TableHead>{d.colRole}</TableHead>
                <TableHead>{d.colPlan}</TableHead>
                <TableHead>{d.colProviderKeys}</TableHead>
                <TableHead>{d.colApiKeys}</TableHead>
                <TableHead>{d.colJoined}</TableHead>
                <TableHead className="text-right">{d.colActions}</TableHead>
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
                          {d.you}
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
                          aria-label={d.planAria(user.email)}
                        >
                          {PLAN_ORDER.map((id) => (
                            <option key={id} value={id}>
                              {t.plans[id].label}
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
                          aria-label={d.durationAria}
                          title={d.durationTitle}
                        />
                        <Button type="submit" variant="ghost" size="sm">
                          {d.set}
                        </Button>
                      </form>
                      {user.planExpiresAt && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {d.until} {formatDateTime(user.planExpiresAt)}
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
                                  ? d.makeUser
                                  : d.makeAdmin}
                              </Button>
                            </form>
                            <form action={deleteUserAction}>
                              <input type="hidden" name="id" value={user.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                title={d.removeUser}
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
