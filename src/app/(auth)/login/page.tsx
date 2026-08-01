import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/app/(auth)/auth-form";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentUser } from "@/lib/auth/session";
import { getTranslations } from "@/lib/i18n";

export const metadata = { title: "Masuk · FreeAll AI" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  const { t } = await getTranslations();

  return (
    <AuthForm
      mode="login"
      t={t.auth}
      action={loginAction}
      footer={
        <>
          {t.auth.noAccount}{" "}
          <Link href="/register" className="text-primary hover:underline">
            {t.common.register}
          </Link>
        </>
      }
    />
  );
}
