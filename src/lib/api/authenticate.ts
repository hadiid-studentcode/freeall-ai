import { API_KEY_PREFIX, sha256 } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedApiKey {
  id: string;
  name: string;
  dailyLimit: number;
  userId: string;
}

export type ApiAuthResult =
  | { ok: true; apiKey: AuthenticatedApiKey }
  | { ok: false; status: 401; error: string };

/**
 * Fase 2 — verifikasi kunci SaaS sebelum AiManager dijalankan.
 *
 * Menerima `Authorization: Bearer sk-freeall-…` (format standar) maupun
 * header `x-api-key` untuk klien yang lebih sederhana.
 */
export async function authenticateRequest(
  request: Request,
): Promise<ApiAuthResult> {
  const rawKey = extractKey(request);

  if (!rawKey) {
    return {
      ok: false,
      status: 401,
      error:
        "API key tidak ditemukan. Sertakan header 'Authorization: Bearer sk-freeall-…'.",
    };
  }

  if (!rawKey.startsWith(API_KEY_PREFIX)) {
    return {
      ok: false,
      status: 401,
      error: `Format API key tidak dikenal. Kunci FreeAll AI diawali '${API_KEY_PREFIX}'.`,
    };
  }

  // Kunci mentah tidak pernah disimpan, jadi pencarian dilakukan lewat hash.
  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(rawKey) },
    select: {
      id: true,
      name: true,
      isActive: true,
      dailyLimit: true,
      userId: true,
    },
  });

  if (!apiKey) {
    return { ok: false, status: 401, error: "API key tidak valid." };
  }
  if (!apiKey.isActive) {
    return { ok: false, status: 401, error: "API key sudah dinonaktifkan." };
  }

  // Sengaja tidak di-await: pencatatan pemakaian tidak boleh menambah latensi
  // maupun menggagalkan request kalau update-nya bermasalah.
  void prisma.apiKey
    .updateMany({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
    .catch(() => undefined);

  return {
    ok: true,
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      dailyLimit: apiKey.dailyLimit,
      userId: apiKey.userId,
    },
  };
}

function extractKey(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }
  return request.headers.get("x-api-key")?.trim() || null;
}
