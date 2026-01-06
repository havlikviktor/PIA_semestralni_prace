"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "../../../../i18n/navigation";
import { useStateTranslation } from "@/hooks/useStateTranslation";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginRedirecter from "@/components/LoginRedirecter";
import { getServerIp } from "@/utils/getServerIp";
import { Project } from "@/types/project";
import { ProjectState } from "@/constants/projectState";
import { Role } from "@/constants/role";
import { ProjectStyleMapper } from "@/utils/ProjectStyleMapper";
import { useRequireAuth } from "@/hooks/useRequireAuth";

export default function ManageProjects() {
  const t = useTranslations("Projects");
  const translateState = useStateTranslation();
  const { authFetch, unauthorized } = useAuth();
  const { missingCredentials, user } = useRequireAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterState, setFilterState] = useState<string>("ALL");
  const serverIp = getServerIp();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await authFetch(`${serverIp}/projects`);
        if (!data) return;
        setProjects(data);
        setFilteredProjects(data);
      } catch (err: any) {
        if (err.message !== "Unauthorized") {
          console.error(err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (user && user.role === Role.ADMINISTRATOR) {
      fetchProjects();
    }
  }, [authFetch, user]);

  useEffect(() => {
    if (filterState === "ALL") {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(projects.filter((p) => p.state === filterState));
    }
  }, [filterState, projects]);

  if (missingCredentials || unauthorized) {
    return <LoginRedirecter />;
  }

  if (isLoading) {
    return <LoadingSpinner text={t("loading")} />;
  }

  return (
    <div className="w-full bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">{t("manageProjects")}</h1>

          <div className="flex items-center space-x-2">
            <label
              htmlFor="stateFilter"
              className="text-sm font-medium text-gray-400"
            >
              {t("filterByState")}:
            </label>
            <select
              id="stateFilter"
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              className="block w-40 rounded-md border-gray-700 bg-gray-800 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            >
              <option value="ALL">{t("all")}</option>
              {Object.values(ProjectState).map((state) => (
                <option key={state} value={state}>
                  {translateState(state)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-stone-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                <tr>
                  <th className="px-6 py-3">{t("number")}</th>
                  <th className="px-6 py-3">{t("state")}</th>
                  <th className="px-6 py-3">{t("language")}</th>
                  <th className="px-6 py-3">{t("fileTitle")}</th>
                  <th className="px-6 py-3">{t("createdAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {t("noProjects")}
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project, index) => (
                    <tr
                      key={project.ProjectId}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() =>
                        router.push(`/projects/${project.ProjectId}`)
                      }
                    >
                      <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${ProjectStyleMapper.getStyle(
                            project.state
                          )}`}
                        >
                          {translateState(project.state)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{project.languageCode}</td>
                      <td className="px-6 py-4 font-medium">
                        {project.fileName}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
