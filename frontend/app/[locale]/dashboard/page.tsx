"use client";

import { useTranslations } from "next-intl";
import DashboardButton from "../../../components/DashboardButton";
import { mapRoleToEnum } from "../../../components/RoleMapper";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginRedirecter from "@/components/LoginRedirecter";
import { Role } from "@/constants/role";

export default function Dashboard() {
  const t = useTranslations("Dashboard");
  const { user, isLoading } = useRequireAuth();

  const userRole = user ? mapRoleToEnum(user.role) : null;

  if (isLoading) {
    return <LoadingSpinner text={t("loading")} />;
  }

  if (!user || !userRole) {
    return <LoginRedirecter />;
  }

  return (
    <div className="w-full bg-black text-white flex flex-col items-center justify-center p-12">
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
              title={userRole === Role.TRANSLATOR ? t("projectsToTranslate") : t("projectsToApproval")}
              href="/projects/active"
              imageSrc="/img/ongoingProjects.png"
            />
          </div>
        )}
      </div>
    </div>
  );
}
