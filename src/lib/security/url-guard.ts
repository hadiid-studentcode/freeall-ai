import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * Penjaga SSRF untuk Base URL penyedia.
 *
 * Base URL diisi pengguna, lalu server ini yang memanggilnya. Tanpa penjagaan,
 * seseorang bisa mengarahkannya ke jaringan internal — endpoint metadata cloud
 * (169.254.169.254), database di localhost, atau layanan di LAN — lalu membaca
 * balasannya lewat pesan error. Karena itu host disaring, dan nama domain
 * diresolusi lebih dulu supaya trik seperti `internal.contoh.com → 127.0.0.1`
 * ikut tertutup.
 */

export type UrlCheck = { ok: true } | { ok: false; reason: string };

/** Rentang yang tidak boleh dihubungi dari sisi server. */
function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v6 = ip.toLowerCase();
    // Loopback, link-local, dan unique-local IPv6.
    if (v6 === "::1" || v6 === "::") return true;
    if (v6.startsWith("fe80:") || v6.startsWith("fc") || v6.startsWith("fd")) {
      return true;
    }
    // IPv4 yang dibungkus IPv6, mis. ::ffff:127.0.0.1
    const mapped = v6.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return false;
  }

  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return true;
  const [a, b] = parts;

  return (
    a === 0 || // 0.0.0.0/8
    a === 10 || // privat
    a === 127 || // loopback
    (a === 169 && b === 254) || // link-local, termasuk metadata cloud
    (a === 172 && b >= 16 && b <= 31) || // privat
    (a === 192 && b === 168) || // privat
    (a === 100 && b >= 64 && b <= 127) || // CGNAT
    a >= 224 // multicast dan reserved
  );
}

/**
 * Pastikan sebuah URL aman dipanggil dari server.
 *
 * Catatan: ini mengurangi risiko, bukan menghapusnya. Masih ada celah
 * teoretis antara pemeriksaan dan panggilan (DNS rebinding). Untuk
 * penjagaan penuh, jalankan panggilan keluar lewat proxy egress yang
 * membatasi tujuan di tingkat jaringan.
 */
export async function assertSafeExternalUrl(
  rawUrl: string,
): Promise<UrlCheck> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Base URL tidak valid." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Base URL harus memakai HTTPS." };
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return { ok: false, reason: "Base URL tidak boleh menunjuk ke jaringan internal." };
  }

  // Alamat IP langsung: periksa apa adanya, tanpa perlu resolusi.
  if (isIP(host)) {
    return isPrivateAddress(host)
      ? { ok: false, reason: "Base URL tidak boleh menunjuk ke alamat internal." }
      : { ok: true };
  }

  try {
    const records = await lookup(host, { all: true });
    if (records.length === 0) {
      return { ok: false, reason: "Host pada Base URL tidak dapat diresolusi." };
    }
    if (records.some((record) => isPrivateAddress(record.address))) {
      return {
        ok: false,
        reason: "Host pada Base URL mengarah ke alamat internal.",
      };
    }
  } catch {
    return { ok: false, reason: "Host pada Base URL tidak dapat diresolusi." };
  }

  return { ok: true };
}
