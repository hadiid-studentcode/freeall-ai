/**
 * Menyusun pesan error HTTP yang benar-benar bisa ditindaklanjuti.
 *
 * Provider tidak selalu membalas JSON. Endpoint yang salah, misalnya, sering
 * membalas 404 dengan body kosong — dan kalau kita hanya membaca
 * `payload.error.message`, yang tersisa cuma "HTTP 404" tanpa petunjuk apa pun.
 * Karena itu URL yang dipanggil ikut disertakan: penyebab tersering justru
 * salah ketik pada baseUrl atau nama model.
 *
 * URL aman dicantumkan karena semua strategy mengirim kredensial lewat header,
 * bukan query string.
 */
export function describeHttpError(args: {
  status: number;
  statusText: string;
  url: string;
  /** Pesan terstruktur dari provider, bila ada. */
  structuredMessage?: string;
  rawBody: string;
}): string {
  const { status, statusText, url, structuredMessage, rawBody } = args;

  if (structuredMessage) return structuredMessage;

  const body = rawBody.trim();
  const detail = body
    ? `body: ${body.slice(0, 200)}`
    : "body kosong — biasanya berarti URL endpoint atau nama model salah";

  const suffix = statusText ? ` ${statusText}` : "";
  return `HTTP ${status}${suffix} dari ${url} (${detail})`;
}

/**
 * Baca header `Retry-After`.
 *
 * Formatnya bisa berupa jumlah detik ("120") atau tanggal HTTP
 * ("Wed, 21 Oct 2026 07:28:00 GMT") — dua-duanya sah menurut spesifikasi, dan
 * provider AI memakai keduanya. Nilai di luar akal (negatif, atau lebih dari
 * sehari) diabaikan supaya sebuah model tidak terkunci lebih lama dari yang
 * masuk akal karena header yang salah.
 */
const MAX_RETRY_AFTER_SECONDS = 24 * 60 * 60;

export function parseRetryAfter(headers: Headers): number | undefined {
  const raw = headers.get("retry-after")?.trim();
  if (!raw) return undefined;

  const seconds = Number(raw);
  if (Number.isFinite(seconds)) {
    return seconds > 0 && seconds <= MAX_RETRY_AFTER_SECONDS
      ? Math.round(seconds)
      : undefined;
  }

  const at = Date.parse(raw);
  if (Number.isNaN(at)) return undefined;

  const delta = Math.round((at - Date.now()) / 1000);
  return delta > 0 && delta <= MAX_RETRY_AFTER_SECONDS ? delta : undefined;
}
