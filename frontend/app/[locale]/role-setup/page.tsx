"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "../../../i18n/navigation";
import { Language } from "../../../constants/languages";
import { useTranslations, useLocale } from "next-intl";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useServerIp } from "@/hooks/useServerIp";

function RoleSetupContent() {
  const t = useTranslations("Auth");
  const tSetup = useTranslations("RoleSetup");
  const locale = useLocale();
  const router = useRouter();
  const { user, token } = useRequireAuth();

  const [role, setRole] = useState("customer");
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const serverIp = useServerIp();

  useEffect(() => {
    if (user) {
      if (user.id) {
        setUserId(user.id);
      } else {
        setError(t("userIdNotFound"));
      }
    }
  }, [user]);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userId || !token) return;

    let body: any = { role };

    if (role === "translator") {
      body.languages = selectedLanguages.map((lang) => ({
        languageCode: lang,
      }));
    }

    try {
      const res = await fetch(`${serverIp}/user/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("errorGeneric"));
      }

      if (user) {
        const updatedUser = { ...user, role, newUser: false };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {tSetup("title")}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t("roleLabel")}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
            >
              <option value="customer">{t("customerRole")}</option>
              <option value="translator">{t("translatorRole")}</option>
            </select>
          </div>

          {role === "translator" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("languagesLabel")}
              </label>
              <div className="h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {Object.values(Language).map((lang) => (
                  <div key={lang} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => handleLanguageChange(lang)}
                      className="mr-2"
                    />
                    <label
                      htmlFor={`lang-${lang}`}
                      className="text-sm text-gray-700"
                    >
                      {new Intl.DisplayNames([locale], {
                        type: "language",
                      }).of(lang)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {tSetup("submitButton")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RoleSetupPage() {
  const t = useTranslations("Auth");
  return (
    <Suspense fallback={<div>{t("loading")}</div>}>
      <RoleSetupContent />
    </Suspense>
  );
}
