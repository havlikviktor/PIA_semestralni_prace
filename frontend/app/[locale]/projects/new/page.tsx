"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import { useRouter } from "../../../../i18n/navigation";
import { Language, LANGUAGE_LABELS } from "../../../../constants/languages";
import { useRequireAuth } from "../../../../hooks/useRequireAuth";
import LoginRedirecter from "@/components/LoginRedirecter";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useServerIp } from "@/hooks/useServerIp";

export default function CreateProject() {
  const t = useTranslations("CreateProject");
  const router = useRouter();
  const { user, token, isLoading } = useRequireAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    Language.ENGLISH
  );
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const serverIp = useServerIp();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!user || !token) {
      return <LoginRedirecter />;
    }

    try {
      if (!file) {
        setError(t("noFileSelected"));
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      formData.append("originalFile", file);
      formData.append("languageCode", selectedLanguage);
      formData.append("customerId", user.id);

      const res = await fetch(`${serverIp}/projects`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t("error"));
      }

      router.push("/projects");
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-black text-white p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-stone-900 rounded-lg shadow-xl border border-gray-800 p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">{t("title")}</h1>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("selectLanguage")}
            </label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="w-full bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(LANGUAGE_LABELS).map(([code, label]) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("uploadFile")}
            </label>
            <div className="relative border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-gray-500 transition-colors text-center">
              <input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-white space-y-2 flex flex-col items-center justify-center ">
                <img src="/img/uploadIcon.svg" alt="Upload file icon" />
                <div className="text-sm text-gray-300">
                  {file ? (
                    <span className="font-medium text-gray-200">
                      {file.name}
                    </span>
                  ) : (
                    <span>{t("selectFile")}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isSubmitting
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? t("loading") : t("submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
