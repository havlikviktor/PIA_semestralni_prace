"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTicketLogin } from "../../../hooks/useTicketLogin";
import { useTranslations } from "next-intl";

function LoginContent() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoading, error } = useTicketLogin();

  useEffect(() => {
    const ticket = searchParams.get("ticket");
    if (!ticket) {
      router.push("/");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="p-8 bg-white rounded shadow-md">
        <h1 className="text-xl font-bold text-black mb-4">{t("googleLoginTitle")}</h1>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <p className="text-black"> {isLoading ? t("processingLogin") : t("successLogin")}</p>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("Auth");
  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <LoginContent />
    </Suspense>
  );
}
