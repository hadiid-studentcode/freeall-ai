"use server";

import { revalidatePath } from "next/cache";

import {
  detectProvider,
  listModels,
  MAX_FALLBACK_MODELS,
  rankModels,
} from "@/lib/ai/discovery";
import { findProvider } from "@/lib/ai/catalog";
import { verifyProviderKey } from "@/lib/ai/verify";
import { requireUser } from "@/lib/auth/guard";
import { assertSafeExternalUrl } from "@/lib/security/url-guard";
import { resolvePlan } from "@/lib/plans";
import {
  decryptSecret,
  encryptSecret,
  generateApiKey,
  previewOf,
  sha256,
} from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

/**
 * Server Action bisa dipanggil lewat POST langsung, tanpa melewati halaman
 * dashboard. Karena itu setiap action di bawah memanggil `requireUser()` dan
 * memfilter query dengan `userId` — otorisasi tidak boleh mengandalkan UI.
 */

export interface ActionState {
  error?: string;
  success?: string;
  /** Hanya diisi saat kunci SaaS baru dibuat; ditampilkan sekali lalu hilang. */
  plaintextKey?: string;
}

/* -------------------------------------------------------------------------- */
/* Kunci SaaS                                                                 */
/* -------------------------------------------------------------------------- */

export async function createApiKeyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim() || "Default";
  const dailyLimit = Number(formData.get("dailyLimit") ?? 500);

  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100_000) {
    return { error: "Kuota harian harus bilangan bulat antara 1 dan 100.000." };
  }

  const account = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true, role: true },
  });
  const plan = resolvePlan(account);

  const count = await prisma.apiKey.count({ where: { userId: user.id } });
  if (count >= plan.maxApiKeys) {
    return {
      error:
        `Paket ${plan.label} dibatasi ${plan.maxApiKeys} API key. ` +
        `Hapus yang tidak terpakai, atau tingkatkan paket untuk menambah kapasitas.`,
    };
  }

  const plaintextKey = generateApiKey();

  await prisma.apiKey.create({
    data: {
      name: name.slice(0, 60),
      keyHash: sha256(plaintextKey),
      keyPrefix: previewOf(plaintextKey),
      dailyLimit,
      userId: user.id,
    },
  });

  revalidatePath("/dashboard/api-keys");
  return {
    success: "API key berhasil dibuat.",
    plaintextKey,
  };
}

export async function toggleApiKeyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  // Filter userId di WHERE, bukan cek setelah fetch — user lain tidak akan
  // pernah menyentuh baris yang bukan miliknya.
  const apiKey = await prisma.apiKey.findFirst({
    where: { id, userId: user.id },
    select: { isActive: true },
  });
  if (!apiKey) return;

  await prisma.apiKey.updateMany({
    where: { id, userId: user.id },
    data: { isActive: !apiKey.isActive },
  });

  revalidatePath("/dashboard/api-keys");
}

/**
 * Ubah kuota harian sebuah API key.
 *
 * Kuota ini adalah rem pemakaian: begitu jumlah request hari ini menyentuh
 * angka tersebut, `/api/v1/chat` membalas 429 sampai tengah malam. Gunanya
 * membatasi satu aplikasi agar tidak menghabiskan seluruh kunci provider —
 * misal aplikasi produksi diberi jatah besar, sedangkan kunci untuk
 * eksperimen atau dibagikan ke orang lain diberi jatah kecil.
 */
export async function updateApiKeyLimitAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const dailyLimit = Number(formData.get("dailyLimit") ?? 0);

  if (!Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 100_000) {
    return;
  }

  await prisma.apiKey.updateMany({
    where: { id, userId: user.id },
    data: { dailyLimit },
  });

  revalidatePath("/dashboard/api-keys");
}

export async function deleteApiKeyAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await prisma.apiKey.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/api-keys");
}

/* -------------------------------------------------------------------------- */
/* Kunci provider AI                                                          */
/* -------------------------------------------------------------------------- */

export async function createProviderKeyAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const providerName = String(formData.get("providerName") ?? "")
    .trim()
    .toLowerCase();
  const rawKey = String(formData.get("key") ?? "").trim();
  const baseUrl = String(formData.get("baseUrl") ?? "").trim();
  const modelName = String(formData.get("modelName") ?? "").trim();
  const priority = Number(formData.get("priority") ?? 0);
  // Hanya admin yang boleh mengisi Provider Publik, supaya user biasa tidak
  // bisa diam-diam menyuguhkan kuncinya ke seluruh pengguna lain.
  const scope =
    user.role === "ADMIN" && formData.get("scope") === "SHARED"
      ? "SHARED"
      : "PRIVATE";

  if (!providerName) return { error: "Pilih penyedia AI terlebih dahulu." };
  if (!rawKey) return { error: "API key provider tidak boleh kosong." };
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
    return { error: "Prioritas harus bilangan bulat antara 0 dan 100." };
  }

  // Mode "auto": kenali penyedia dari kunci, lalu tanyakan langsung ke
  // penyedia itu model apa yang hidup. Ini yang membuat user cukup menempel
  // kunci tanpa tahu Base URL maupun nama model.
  let preset = await findProvider(providerName);
  // Model diurutkan dari yang paling layak. Yang pertama jadi model utama,
  // sisanya jadi cadangan pada kunci yang sama — kuota gratis dihitung per
  // model, jadi model utama yang kena 429 belum tentu menghabiskan yang lain.
  let ranked: string[] = [];

  if (providerName === "auto") {
    const detection = await detectProvider(rawKey);
    if (!detection.ok) return { error: detection.error };

    preset = detection.provider.preset;
    ranked = rankModels(detection.provider.models, preset.format);

    if (ranked.length === 0) {
      return {
        error:
          `Penyedia terdeteksi sebagai ${preset.label}, tetapi tidak ada model ` +
          `chat yang tersedia untuk kunci ini. Pilih penyedia dan model manual.`,
      };
    }
  }

  const resolvedProviderName = preset?.id ?? providerName;
  const resolvedBaseUrl = baseUrl || preset?.baseUrl || "";

  if (!resolvedBaseUrl) {
    return {
      error: "Base URL wajib diisi untuk penyedia yang tidak punya preset.",
    };
  }
  // Base URL diisi pengguna dan dipanggil oleh server ini, jadi harus dijaga
  // agar tidak bisa dipakai menembak jaringan internal (SSRF).
  const urlCheck = await assertSafeExternalUrl(resolvedBaseUrl);
  if (!urlCheck.ok) {
    return { error: urlCheck.reason };
  }

  // Penyedia dipilih manual tanpa nama model: cari model yang hidup sebelum
  // jatuh ke default preset, yang mungkin sudah dipensiunkan.
  if (ranked.length === 0 && !modelName && preset) {
    const models = await listModels(preset, rawKey, resolvedBaseUrl);
    ranked = models ? rankModels(models, preset.format) : [];
  }

  const resolvedModel = modelName || ranked[0] || preset?.defaultModel || "";
  const fallbackModels = (modelName ? ranked : ranked.slice(1))
    .filter((model) => model !== resolvedModel)
    .slice(0, MAX_FALLBACK_MODELS);

  if (!resolvedModel) {
    return { error: "Nama model wajib diisi untuk penyedia ini." };
  }

  const keyHash = sha256(rawKey);
  const duplicate = await prisma.providerKey.findUnique({
    where: { keyHash },
    select: { id: true },
  });
  if (duplicate) {
    return { error: "API key ini sudah terdaftar di sistem." };
  }

  const keyCiphertext = encryptSecret(rawKey);
  const format = preset?.format ?? "openai";

  // Uji kunci sekali sebelum menyimpan. Nama model yang sudah dipensiunkan atau
  // kuota gratis yang ditutup baru terlihat lewat panggilan nyata seperti ini.
  const verification = await verifyProviderKey({
    providerName: resolvedProviderName,
    keyCiphertext,
    format,
    baseUrl: resolvedBaseUrl,
    modelName: resolvedModel,
  });

  const rejected = verification.status === "rejected";

  await prisma.providerKey.create({
    data: {
      providerName: resolvedProviderName,
      keyCiphertext,
      keyHash,
      keyPreview: previewOf(rawKey),
      format,
      baseUrl: resolvedBaseUrl,
      modelName: resolvedModel,
      fallbackModels,
      priority,
      scope,
      userId: user.id,
      // Kunci yang jelas ditolak tetap disimpan supaya bisa diperbaiki, tapi
      // dinonaktifkan agar tidak memperlambat setiap request fallback.
      isActive: !rejected,
      ...(rejected
        ? {
            disabledReason: "Gagal uji koneksi saat ditambahkan",
            lastError: verification.message.slice(0, 500),
            lastErrorAt: new Date(),
          }
        : {}),
    },
  });

  revalidatePath("/dashboard/providers");
  revalidatePath("/dashboard");

  const label = preset?.label ?? resolvedProviderName;
  const detectedNote =
    providerName === "auto" ? ` (terdeteksi otomatis dari kunci)` : "";

  if (rejected) {
    return {
      error:
        `Kunci ${label}${detectedNote} disimpan tetapi dinonaktifkan — ` +
        `uji koneksi gagal: ${verification.message} ` +
        `Periksa kembali API key, Base URL, dan nama modelnya.`,
    };
  }

  if (verification.status === "transient") {
    return {
      success:
        `Kunci ${label}${detectedNote} ditambahkan dengan model ${resolvedModel}, ` +
        `tetapi uji koneksi belum berhasil (${verification.message}). ` +
        `Kunci tetap aktif karena penyebabnya kemungkinan sementara.`,
    };
  }

  return {
    success:
      `Kunci ${label}${detectedNote} berhasil ditambahkan dan diuji ` +
      `dengan model ${verification.model}.` +
      (fallbackModels.length > 0
        ? ` ${fallbackModels.length} model cadangan disiapkan bila model ini kena limit.`
        : ""),
  };
}

/**
 * Tanyakan ulang ke penyedia model apa yang sekarang hidup untuk kunci ini,
 * lalu perbarui model utama dan cadangannya.
 *
 * Berguna saat penyedia memensiunkan model atau menutup kuota gratisnya —
 * user tidak perlu menghapus dan mendaftarkan ulang kuncinya.
 */
export async function refreshProviderModelsAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const providerKey = await prisma.providerKey.findFirst({
    where: { id, userId: user.id },
    select: {
      providerName: true,
      keyCiphertext: true,
      baseUrl: true,
      modelName: true,
    },
  });
  if (!providerKey) return;

  const preset = await findProvider(providerKey.providerName);
  if (!preset) return;

  const models = await listModels(
    preset,
    decryptSecret(providerKey.keyCiphertext),
    providerKey.baseUrl ?? undefined,
  );
  if (!models || models.length === 0) return;

  const ranked = rankModels(models, preset.format);
  if (ranked.length === 0) return;

  // Model yang sedang dipakai dipertahankan sebagai utama bila masih hidup —
  // menyegarkan daftar tidak seharusnya mengganti model yang sudah terbukti.
  const stillAlive =
    providerKey.modelName && ranked.includes(providerKey.modelName);
  const primary = stillAlive ? providerKey.modelName! : ranked[0];

  await prisma.providerKey.updateMany({
    where: { id, userId: user.id },
    data: {
      modelName: primary,
      fallbackModels: ranked
        .filter((model) => model !== primary)
        .slice(0, MAX_FALLBACK_MODELS),
    },
  });

  revalidatePath("/dashboard/providers");
}

export async function toggleProviderKeyAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  const providerKey = await prisma.providerKey.findFirst({
    where: { id, userId: user.id },
    select: { isActive: true },
  });
  if (!providerKey) return;

  const reactivating = !providerKey.isActive;

  await prisma.providerKey.updateMany({
    where: { id, userId: user.id },
    data: {
      isActive: reactivating,
      // Mengaktifkan ulang berarti user sudah memperbaiki masalahnya —
      // hitungan error direset agar kunci kembali diprioritaskan wajar.
      ...(reactivating
        ? { disabledReason: null, errorCount: 0, lastError: null }
        : { disabledReason: "Dinonaktifkan manual oleh pemilik" }),
    },
  });

  revalidatePath("/dashboard/providers");
  revalidatePath("/dashboard");
}

export async function updateProviderPriorityAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  const priority = Number(formData.get("priority") ?? 0);

  if (!Number.isInteger(priority) || priority < 0 || priority > 100) return;

  await prisma.providerKey.updateMany({
    where: { id, userId: user.id },
    data: { priority },
  });

  revalidatePath("/dashboard/providers");
}

export async function deleteProviderKeyAction(
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");

  await prisma.providerKey.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/dashboard/providers");
  revalidatePath("/dashboard");
}
