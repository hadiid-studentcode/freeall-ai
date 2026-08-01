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
