import type { Dictionary } from "@/lib/i18n";

/**
 * Alasan sebuah ProviderKey dinonaktifkan, dalam bentuk yang bisa dwibahasa.
 *
 * Nilainya tersimpan di database, jadi tidak bisa ikut bahasa kalau ditulis
 * sebagai kalimat jadi. Alasan yang berasal dari kode kita sendiri karena itu
 * disimpan sebagai kode pendek dan baru diterjemahkan saat ditampilkan.
 * Pesan mentah dari penyedia — dan baris lama yang terlanjur berbahasa
 * Indonesia — dilewatkan apa adanya.
 */
export const DISABLED_VERIFY_FAILED = "code:verify-failed";
export const DISABLED_MANUAL = "code:manual";

const REJECTED_PREFIX = "code:rejected:";

/** Ditolak penyedia (401/403); status HTTP-nya ikut disimpan. */
export function disabledRejectedCode(status: number | null): string {
  return `${REJECTED_PREFIX}${status ?? "?"}`;
}

export function describeDisabledReason(
  reason: string | null,
  t: Dictionary["errors"]["provider"],
): string | null {
  if (!reason) return null;
  if (reason === DISABLED_VERIFY_FAILED) return t.disabledVerifyFailed;
  if (reason === DISABLED_MANUAL) return t.disabledManual;
  if (reason.startsWith(REJECTED_PREFIX)) {
    return t.disabledRejected(reason.slice(REJECTED_PREFIX.length));
  }
  return reason;
}
