"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import DashboardButton from "../../../components/DashboardButton";
import RoleMapper, {
  Role,
  mapRoleToEnum,
} from "../../../components/RoleMapper";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUser(parsedUser);
        const mappedRole = mapRoleToEnum(parsedUser.role);
        setUserRole(mappedRole);
      } catch (e) {
        console.error("Failed to parse user data or map role", e);
        localStorage.removeItem("user");
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-xl">{t("loading")}</p>
      </div>
    );
  }

  if (!user || !userRole) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">
          {t("errorUserNotFound")}
        </h1>
        <a
          href="/"
          className="text-blue-300 hover:text-white underline text-lg"
        >
          {t("loginAgain")}
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Navigation Bar */}
      <header className="bg-stone-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
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
                    <RoleMapper role={user.role} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-12">
        <h1 className="text-4xl font-bold mb-4">{t("welcome")}</h1>
        <p className="text-xl mb-12 text-gray-400">{t("loggedIn")}</p>

        <div className="flex flex-wrap justify-center gap-6 w-full max-w-6xl">
          {(userRole === Role.ADMINISTRATOR ||
            userRole === Role.CUSTOMER ||
            userRole === Role.TRANSLATOR) && (
            <div className="w-full sm:w-64 lg:w-72">
              <DashboardButton
                title={t("projects")}
                href="/projects"
                imageSrc="/img/projects.png"
              />
            </div>
          )}

          {(userRole === Role.ADMINISTRATOR || userRole === Role.CUSTOMER) && (
            <div className="w-full sm:w-64 lg:w-72">
              <DashboardButton
                title={t("newProject")}
                href="/projects/new"
                imageSrc="/img/newProject1.png"
              />
            </div>
          )}

          {userRole === Role.ADMINISTRATOR && (
            <div className="w-full sm:w-64 lg:w-72">
              <DashboardButton
                title={t("manageProjects")}
                href="/projects/manage"
                imageSrc="/img/manageProjects1.png"
              />
            </div>
          )}

          {(userRole === Role.ADMINISTRATOR ||
            userRole === Role.CUSTOMER ||
            userRole === Role.TRANSLATOR) && (
            <div className="w-full sm:w-64 lg:w-72">
              <DashboardButton
                title={t("activeProjects")}
                href="/projects/active"
                imageSrc="/img/ongoingProjects.png"
              />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
