"use client";

import { useTranslations } from "next-intl";
import { use, useEffect, useState } from "react";
import { useRouter } from "../../../i18n/navigation";
import StateMapper, { mapStateToEnum } from "../../../components/StateMapper";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import LoadingSpinner from "@/components/LoadingSpinner";
import LoginRedirecter from "@/components/LoginRedirecter";
import { useServerIp } from "@/hooks/useServerIp";
import { ProjectState } from "@/constants/projectState";
import { FileState } from "@/constants/fileState";
import Alert from "@/components/Alert";

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

  const handleDownload = async (
    e: React.MouseEvent,
    projectId: number,
    type: "original" | "translated"
  ) => {
    e.stopPropagation();
    if (!token) return;

    try {
      const res = await fetch(
        `${serverIp}/projects/${projectId}/file?type=${type}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = res.headers.get("Content-Disposition");
      let filename = `${type}_file`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      setError(t("downloadError"));
    }
  };

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
                    className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                    onClick={() =>
                      router.push(`/projects/${project.ProjectId}`)
                    }
                  >
                    <td className="px-6 py-4 text-gray-400">{index + 1}</td>
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
                            : project.state === "rejected"
                            ? "bg-rose-900 text-rose-300"
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
                    <td className="px-6 py-4 flex gap-2">
                      <button
                        onClick={(e) =>
                          handleDownload(e, project.ProjectId, FileState.ORIGINAL)
                        }
                        className="text-gray-400 hover:text-white transition-colors"
                        title={t("downloadOriginal")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                          />
                        </svg>
                      </button>
                      {[ProjectState.COMPLETED, ProjectState.REJECTED, ProjectState.APPROVED, ProjectState.CLOSED].includes(
                        mapStateToEnum(project.state)
                      ) && (
                        <button
                          onClick={(e) =>
                            handleDownload(e, project.ProjectId, FileState.TRANSLATED)
                          }
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title={t("downloadTranslated")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                        </button>
                      )}
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
