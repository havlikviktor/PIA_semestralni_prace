"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LoginRedirecter from "@/components/LoginRedirecter";
import { useServerIp } from "@/hooks/useServerIp";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProjectState } from "@/constants/projectState";
import StateMapper, { mapStateToEnum } from "@/components/StateMapper";
import Alert from "@/components/Alert";
import { Project } from "@/types/project";
import { Role } from "@/constants/role";
import { ProjectStyleMapper } from "@/utils/ProjectStyleMapper";

export default function ProjectPage() {
  const { token, isLoading, user } = useRequireAuth();
  const params = useParams();
  const id = params.id;
  const t = useTranslations("ProjectDetails");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const serverIp = useServerIp();
  const [alert, setAlert] = useState<{
    title: string;
    text: string;
    show: boolean;
  }>({
    title: "",
    text: "",
    show: false,
  });

  if (!token && !isLoading) return <LoginRedirecter />;

  useEffect(() => {
    if (!token || !id) return;

    const fetchProject = async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      try {
        const res = await fetch(`${serverIp}/projects/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(t("fetchError"));
        }

        const data = await res.json();
        setProject(data);
      } catch (err) {
        console.error(err);
        setError(t("loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [token, id, t, serverIp]);

  const handleUpdateState = async (newState: string) => {
    if (!token || !project) return;
    try {
      const res = await fetch(`${serverIp}/projects/${project.ProjectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ state: newState }),
      });

      if (!res.ok) throw new Error(t("updateError"));

      const updatedProject = await res.json();
      setProject(updatedProject);
      setAlert({
        title: t("sendSuccess"),
        text: t("updateSuccess"),
        show: true,
      });
    } catch (err) {
      console.error(err);
      setAlert({
        title: t("error"),
        text: t("updateError"),
        show: true,
      });
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !project) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${serverIp}/projects/${project.ProjectId}/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text: feedbackText }),
        }
      );

      if (!res.ok) {
        setAlert({
          title: t("error"),
          text: t("feedbackError") + ` (${res.status})`,
          show: true,
        });
      }

      const newFeedback = await res.json();
      setProject({ ...project, feedback: newFeedback });
      setFeedbackText("");
      setAlert({
        title: t("sendSuccess"),
        text: t("feedbackSuccess"),
        show: true,
      });
    } catch (err) {
      console.error(err);
      setAlert({
        title: t("error"),
        text: t("fetchError"),
        show: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !token || !project) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("translatedFile", selectedFile);

    try {
      const res = await fetch(
        `${serverIp}/projects/${project.ProjectId}/file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const updatedProject = await res.json();
      setProject(updatedProject);
      setAlert({
        title: t("sendSuccess"),
        text: t("uploadSuccess"),
        show: true,
      });
      setSelectedFile(null);
    } catch (err) {
      console.error(err);
      setAlert({ title: t("error"), text: t("uploadError"), show: true });
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <LoadingSpinner text={t("loading")} />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div>{t("notFound")}</div>;

  return (
    <div className=" flex items-center justify-center bg-black">
      <Alert title={alert.title} text={alert.text} show={alert.show} />
      <div className="p-6 pt-10 text-black w-full max-w-3xl">
        <h1 className="text-2xl text-gray-200 font-bold mb-4">{t("title")}</h1>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("file")}</h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-600">
                  {t("fileName")}
                </label>
                <p>{project.fileName}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("language")}
                </label>
                <p>{project.languageCode}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("state")}
                </label>
                <p
                  className={`px-2 py-1 rounded-full font-medium w-fit ${ProjectStyleMapper.getStyle(
                    project.state
                  )}`}
                >
                  <StateMapper state={project.state} />
                </p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("createdAt")}
                </label>
                <p>{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("translatedFileStatus")}
                </label>
                <p
                  className={
                    project.hasTranslatedFile
                      ? "text-green-500"
                      : "text-gray-700"
                  }
                >
                  {project.hasTranslatedFile ? t("yes") : t("no")}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200 my-6" />

          <div>
            <h2 className="text-xl font-semibold mb-2">
              {t("customer")}
              {user?.role === Role.CUSTOMER && (
                <span className="text-green-500 pl-2">({t("you")})</span>
              )}
            </h2>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
              <div>
                <label className="font-semibold text-gray-600">
                  {t("name")}
                </label>
                <p>{project.customer.name}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("email")}
                </label>
                <p>{project.customer.email}</p>
              </div>
            </div>
          </div>

          {project.translator && (
            <>
              <hr className="border-t border-gray-200 my-6" />
              <div>
                <h2 className="text-xl font-semibold mb-2">
                  {t("translator")}
                  {user?.role === Role.TRANSLATOR && (
                    <span className="text-green-500 pl-2">({t("you")})</span>
                  )}
                </h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-gray-600">
                      {t("name")}
                    </label>
                    <p>{project.translator.name}</p>
                  </div>
                  <div>
                    <label className="font-semibold text-gray-600">
                      {t("email")}
                    </label>
                    <p>{project.translator.email}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Translator Actions */}
          {user?.role === Role.TRANSLATOR &&
            mapStateToEnum(project.state) === ProjectState.ASSIGNED && (
              <>
                <hr className="border-t border-gray-200 my-6" />
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-2">
                    {t("translatorActions")}
                  </h2>

                  {/* File Upload */}
                  <div className="bg-gray-50 p-4 rounded">
                    <label className="block mb-2 font-medium">
                      {t("uploadTranslation")}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                      />
                      <button
                        onClick={handleUpload}
                        disabled={uploading || !selectedFile}
                        className="bg-black text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-zinc-300 disabled:cursor-not-allowed"
                      >
                        {uploading ? t("uploading") : t("upload")}
                      </button>
                    </div>
                  </div>

                  {/* Complete Project */}
                  {project.hasTranslatedFile && (
                    <button
                      onClick={() => handleUpdateState(ProjectState.COMPLETED)}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 w-full font-semibold"
                    >
                      {t("completeProject")}
                    </button>
                  )}
                </div>
              </>
            )}

          <hr className="border-t border-gray-200 my-6" />

          {/* Actions for Completed Projects */}
          {user?.role === Role.CUSTOMER &&
            mapStateToEnum(project.state) === ProjectState.COMPLETED && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleUpdateState(ProjectState.APPROVED)}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                  {t("accept")}
                </button>
                <button
                  onClick={() => handleUpdateState(ProjectState.REJECTED)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                >
                  {t("reject")}
                </button>
              </div>
            )}

          {/* Feedback Section */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{t("feedback")}</h2>
            {project.feedback ? (
              <div className="bg-gray-50 p-4 rounded">
                <p>{project.feedback.text}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(project.feedback.createdAt).toLocaleDateString()}
                </p>
              </div>
            ) : [ProjectState.APPROVED, ProjectState.REJECTED].includes(
                mapStateToEnum(project.state)
              ) ? (
              <form onSubmit={handleSubmitFeedback} className="space-y-4">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  className="w-full border rounded p-2"
                  placeholder={t("feedbackPlaceholder")}
                  rows={4}
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {submitting ? t("loading") : t("submitFeedback")}
                </button>
              </form>
            ) : (
              <p className="text-gray-500">{t("noFeedback")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
