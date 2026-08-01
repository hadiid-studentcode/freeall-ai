import { redirect } from "next/navigation";

import { getCurrentUser, type SessionUser } from "@/lib/auth/session";

/**
 * Wajibkan user login.
 *
 * Dipanggil ulang di setiap page dan Server Action, bukan sekali di layout.
 * Server Action bisa dipicu lewat POST langsung tanpa melewati layout, jadi
 * pengecekan di layout saja tidak cukup untuk mengamankannya.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
