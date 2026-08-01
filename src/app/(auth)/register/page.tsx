import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/app/(auth)/auth-form";
import { registerAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Daftar · FreeAll AI" };

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  const { t } = await getTranslations();

  return (
    <AuthForm
      mode="register"
      t={t.auth}
      action={registerAction}
      footer={
        <>
          {t.auth.hasAccount}{" "}
          <Link href="/login" className="text-primary hover:underline">
            {t.common.login}
          </Link>
        </>
      }
    />
  );
}
