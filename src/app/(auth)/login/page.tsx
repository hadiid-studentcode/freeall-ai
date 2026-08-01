import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/app/(auth)/auth-form";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Masuk · FreeAll AI" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthForm
      mode="login"
      action={loginAction}
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Daftar gratis
          </Link>
        </>
      }
    />
  );
}
