"use server";

import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  pruneExpiredSessions,
} from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export interface AuthFormState {
  error?: string;
}

const MIN_PASSWORD_LENGTH = 8;

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

  if (!email || !email.includes("@")) {
    return { error: "Alamat email tidak valid." };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Kata sandi minimal ${MIN_PASSWORD_LENGTH} karakter.` };
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existing) {
    return { error: "Email ini sudah terdaftar. Silakan masuk." };
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

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  // Pesan error sengaja disamakan untuk email tidak ada dan sandi salah,
  // supaya tidak bisa dipakai menebak email mana yang terdaftar.
  const invalid = { error: "Email atau kata sandi salah." };
  if (!user) return invalid;
  if (!(await verifyPassword(password, user.passwordHash))) return invalid;

  await pruneExpiredSessions();
  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
