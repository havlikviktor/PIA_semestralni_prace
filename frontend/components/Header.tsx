"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useRoleTranslation } from "../hooks/useRoleTranslation";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useTranslations("Dashboard");
  const translateRole = useRoleTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);

  const isLoginPage = pathname === "/" || /^\/[a-zA-Z]{2}$/.test(pathname);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch (e) {
        console.error("Failed to parse user data", e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    setUser(null);
    router.push("/");
  };

  return (
    <header className="bg-stone-900 shadow-sm border-b border-gray-800">
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {user && !isLoginPage && (
              <div className="flex items-center space-x-3">
                <div className="bg-gray-800 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white">
                    {user.name}
                  </span>
                  <span className="text-xs text-gray-400 capitalize">
                    {translateRole(user.role)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user && !isLoginPage && (
              <button
                onClick={handleLogout}
                className="text-gray-200 hover:text-white text-sm font-medium"
              >
                {t("logout")}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
