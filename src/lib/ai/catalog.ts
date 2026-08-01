import {
  PROVIDER_PRESETS,
  type ProviderFormat,
  type ProviderPreset,
} from "@/lib/ai/providers";
import { prisma } from "@/lib/prisma";

/**
 * Katalog penyedia gabungan: preset bawaan (dari kode) + penyedia tambahan
 * yang didaftarkan admin (dari database).
 *
 * Preset bawaan tetap di kode karena membawa `keyPattern` — pola regex untuk
 * mengenali penyedia dari bentuk kuncinya. Menyimpan regex buatan pengguna di
 * database membuka celah pola yang lambat atau salah, jadi penyedia tambahan
 * sengaja tidak punya pengenalan otomatis: kuncinya didaftarkan dengan memilih
 * penyedia secara manual.
 */

/** Semua penyedia yang tersedia, siap ditampilkan di UI. */
export async function getProviderCatalog(): Promise<ProviderPreset[]> {
  const custom = await prisma.customProvider.findMany({
    orderBy: { createdAt: "asc" },
  });

  const builtInIds = new Set(PROVIDER_PRESETS.map((preset) => preset.id));

  const extra: ProviderPreset[] = custom
    // Slug yang bentrok dengan preset bawaan diabaikan agar preset bawaan —
    // yang punya pengenalan kunci otomatis — tidak tertimpa.
    .filter((row) => !builtInIds.has(row.slug))
    .map((row) => ({
      id: row.slug,
      label: row.label,
      format: row.format as ProviderFormat,
      baseUrl: row.baseUrl,
      defaultModel: row.defaultModel,
      consoleUrl: row.consoleUrl ?? "",
      free: row.free,
      note: row.note ?? undefined,
    }));

  // Opsi "custom" selalu diletakkan paling akhir karena bukan penyedia nyata,
  // melainkan jalan keluar untuk endpoint yang tidak ada di daftar.
  const customOption = PROVIDER_PRESETS.filter((p) => p.id === "custom");
  const builtIn = PROVIDER_PRESETS.filter((p) => p.id !== "custom");

  return [...builtIn, ...extra, ...customOption];
}

/** Cari satu penyedia, baik bawaan maupun tambahan dari admin. */
export async function findProvider(
  providerName: string,
): Promise<ProviderPreset | undefined> {
  const needle = providerName.trim().toLowerCase();
  const catalog = await getProviderCatalog();
  return catalog.find((preset) => preset.id === needle);
}
