"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  pruneExpiredSessions,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { getTranslations } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { checkLoginAttempts, recordFailedLogin } from "@/lib/rate-limit";

export interface AuthFormState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

/** IP pemanggil, untuk membatasi percobaan masuk per sumber. */
async function callerIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return store.get("x-real-ip")?.trim() || "unknown";
}

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
    name: String(formData.get("name") ?? "").trim(),
  };
}

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password, name } = readCredentials(formData);
  const { t } = await getTranslations();

  if (!email || !email.includes("@")) {
    return { error: t.errors.auth.invalidEmail };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: t.errors.auth.passwordTooShort(MIN_PASSWORD_LENGTH) };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: t.errors.auth.emailTaken };
  }

  // User pertama otomatis jadi ADMIN — memudahkan setup self-hosted.
  const isFirstUser = (await prisma.user.count()) === 0;

  const user = await prisma.user.create({
    data: {
      email,
      name: name || null,
      passwordHash: await hashPassword(password),
      role: isFirstUser ? "ADMIN" : "USER",
    },
    select: { id: true },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  const { t } = await getTranslations();

  const ip = await callerIp();

  // Tahan penebakan kata sandi berulang sebelum menyentuh database.
  const throttle = checkLoginAttempts(email, ip);
  if (!throttle.allowed) {
    const minutes = Math.ceil((throttle.retryAfterSeconds ?? 0) / 60);
    return { error: t.errors.auth.tooManyAttempts(minutes) };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Pesan error sengaja disamakan untuk email tidak ada dan sandi salah,
  // supaya tidak bisa dipakai menebak email mana yang terdaftar.
  const invalid = { error: t.errors.auth.invalidCredentials };
  if (!user) {
    recordFailedLogin(email, ip);
    return invalid;
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    recordFailedLogin(email, ip);
    return invalid;
  }

  await pruneExpiredSessions();
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
