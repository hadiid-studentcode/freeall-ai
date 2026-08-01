import { cache } from "react";
import { cookies } from "next/headers";

import type { Role } from "@/generated/prisma/enums";
import { generateSessionToken, sha256 } from "@/lib/crypto";
import { isProduction } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "freeall_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 hari

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
}

/**
 * Buat sesi baru dan pasang cookie-nya.
 *
 * Cookie membawa token mentah, database hanya menyimpan SHA-256-nya — jadi
 * bocornya isi tabel Session tidak cukup untuk membajak akun siapa pun.
 */
export async function createSession(userId: string): Promise<void> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: { tokenHash: sha256(token), userId, expiresAt },
  });

  // `cookies()` async sejak Next.js 15.
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Baca user dari cookie sesi. Mengembalikan null kalau tidak login.
 *
 * Dibungkus `cache()` supaya satu request yang memanggil ini dari layout,
 * page, dan beberapa komponen sekaligus tetap hanya sekali query.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    select: {
      expiresAt: true,
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** Bersihkan sesi kedaluwarsa; dipanggil sesekali saat login. */
export async function pruneExpiredSessions(): Promise<void> {
  await prisma.session
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => undefined);
}
