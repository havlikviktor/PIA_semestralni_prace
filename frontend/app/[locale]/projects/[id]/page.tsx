"use client";

import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import LoginRedirecter from "@/components/LoginRedirecter";
import { useServerIp } from "@/hooks/useServerIp";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ProjectState } from "@/constants/projectState";
import { mapStateToEnum } from "@/components/StateMapper";
import Alert from "@/components/Alert";
import { Project } from "@/types/project";

export default function ProjectPage() {
  const { token, isLoading } = useRequireAuth();
  const params = useParams();
  const id = params.id;
  const t = useTranslations("ProjectDetails");
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
        title: t("SendSuccess"),
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
        title: t("SendSuccess"),
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
                <p>{project.state}</p>
              </div>
              <div>
                <label className="font-semibold text-gray-600">
                  {t("createdAt")}
                </label>
                <p>{new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-200 my-6" />

          <div>
            <h2 className="text-xl font-semibold mb-2">{t("customer")}</h2>
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

          <hr className="border-t border-gray-200 my-6" />

          {/* Actions for Completed Projects */}
          {mapStateToEnum(project.state) === ProjectState.COMPLETED && (
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
