import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/app/(auth)/auth-form";
import { registerAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Daftar · FreeAll AI" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthForm
      mode="register"
      action={registerAction}
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Masuk
          </Link>
        </>
      }
    />
  );
}
