"use server";

import { revalidatePath } from "next/cache";

import {
  detectProvider,
  listModels,
  pickBestModel,
} from "@/lib/ai/discovery";
import { findPreset } from "@/lib/ai/providers";
import { verifyProviderKey } from "@/lib/ai/verify";
import { requireUser } from "@/lib/auth/guard";
import {
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

  const count = await prisma.apiKey.count({ where: { userId: user.id } });
  if (count >= 20) {
    return { error: "Maksimal 20 API key per akun. Hapus yang tidak terpakai." };
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

  if (!providerName) return { error: "Pilih penyedia AI terlebih dahulu." };
  if (!rawKey) return { error: "API key provider tidak boleh kosong." };
  if (!Number.isInteger(priority) || priority < 0 || priority > 100) {
    return { error: "Prioritas harus bilangan bulat antara 0 dan 100." };
  }

  // Mode "auto": kenali penyedia dari kunci, lalu tanyakan langsung ke
  // penyedia itu model apa yang hidup. Ini yang membuat user cukup menempel
  // kunci tanpa tahu Base URL maupun nama model.
  let preset = findPreset(providerName);
  let discoveredModel: string | null = null;

  if (providerName === "auto") {
    const detection = await detectProvider(rawKey);
    if (!detection.ok) return { error: detection.error };

    preset = detection.provider.preset;
    discoveredModel = pickBestModel(
      detection.provider.models,
      preset.format,
    );

    if (!discoveredModel) {
      return {
        error:
          `Penyedia terdeteksi sebagai ${preset.label}, tetapi tidak ada model ` +
          `chat yang tersedia untuk kunci ini. Pilih penyedia dan model manual.`,
      };
    }
  }

  const resolvedProviderName = preset?.id ?? providerName;
  const resolvedBaseUrl = baseUrl || preset?.baseUrl || "";
  let resolvedModel = modelName || discoveredModel || preset?.defaultModel || "";

  if (!resolvedBaseUrl) {
    return {
      error: "Base URL wajib diisi untuk penyedia yang tidak punya preset.",
    };
  }
  if (!/^https:\/\//i.test(resolvedBaseUrl)) {
    return { error: "Base URL harus memakai HTTPS." };
  }

  // Penyedia dipilih manual tanpa nama model: coba temukan model yang hidup
  // sebelum jatuh ke default preset, yang mungkin sudah dipensiunkan.
  if (!resolvedModel && preset) {
    const models = await listModels(preset, rawKey, resolvedBaseUrl);
    resolvedModel =
      (models && pickBestModel(models, preset.format)) ??
      preset.defaultModel ??
      "";
  }

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
      priority,
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
      `dengan model ${verification.model}.`,
  };
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
