"use client";

import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { useRouter } from "../../../i18n/navigation";
import StateMapper from "../../../components/StateMapper";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginRedirecter from "@/components/LoginRedirecter";
import { useServerIp } from "@/hooks/useServerIp";

interface Project {
  ProjectId: number;
  state: string;
  fileName: string;
  languageCode: string;
  createdAt: string;
}

export default function Projects() {
  const t = useTranslations("Projects");
  const { token } = useRequireAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const serverIp = useServerIp();

  useEffect(() => {
    const fetchProjects = async () => {
      if (!token) {
        return <LoginRedirecter />;
      }
      try {
        const res = await fetch(`${serverIp}/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          return <LoginRedirecter />;
        }

        if (!res.ok) {
          throw new Error(t("fetchError"));
        }

        const data = await res.json();
        setProjects(data);
      } catch (err) {
        console.error(err);
        setError(t("failedToLoad"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [token, t]);

  if (isLoading) {
    return <LoadingSpinner text={t("loading")} />;
  }

  return (
    <div className="w-full bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="bg-stone-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
              <tr>
                <th className="px-6 py-3">{t("number")}</th>
                <th className="px-6 py-3">{t("state")}</th>
                <th className="px-6 py-3">{t("language")}</th>
                <th className="px-6 py-3">{t("fileTitle")}</th>
                <th className="px-6 py-3">{t("createdAt")}</th>
                <th className="px-6 py-3">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {projects.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {t("noProjects")}
                  </td>
                </tr>
              ) : (
                projects.map((project, index) => (
                  <tr
                    key={project.ProjectId}
                    className="hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-400">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          project.state === "created"
                            ? "bg-blue-900 text-blue-300"
                            : project.state === "assigned"
                            ? "bg-yellow-900 text-yellow-300"
                            : project.state === "completed"
                            ? "bg-lime-900 text-lime-300"
                            : project.state === "approved"
                            ? "bg-purple-900 text-purple-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        <StateMapper state={project.state} />
                      </span>
                    </td>
                    <td className="px-6 py-4">{project.languageCode}</td>
                    <td className="px-6 py-4 font-medium">
                      {project.fileName}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-blue-400 hover:text-blue-300 text-sm"
                        onClick={() => router.push(`/projects/${project.ProjectId}`)}>
                        {t("detail")}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
