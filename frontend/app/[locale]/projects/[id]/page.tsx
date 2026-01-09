'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginRedirecter from '@/components/LoginRedirecter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ProjectState } from '@/constants/projectState';
import { mapStateToEnum } from '@/utils/StateMapper';
import { useStateTranslation } from '@/hooks/useStateTranslation';
import Alert from '@/components/Alert';
import { Project } from '@/types/project';
import { Role } from '@/constants/role';
import { downloadProjectFile } from '@/utils/fileDownloader';
import { FileState } from '@/constants/fileState';
import { mapRoleToEnum } from '@/utils/RoleMapper';
import CustomerActions from '@/components/project-details/CustomerActions';
import TranslatorActions from '@/components/project-details/TranslatorActions';
import FeedbackSection from '@/components/project-details/FeedbackSection';
import AdminActions from '@/components/project-details/AdminActions';
import ProjectInfo from '@/components/project-details/ProjectInfo';
import UserInfo from '@/components/project-details/UserInfo';
import AdminEmailPanel from '@/components/project-details/AdminEmailPanel';
import { useProjectsSocket } from '@/hooks/useProjectsSocket';
import { getServerIp } from '@/utils/getServerIp';
import type { ProjectDetail } from '@/constants/projectSocketEvents';

export default function ProjectPage() {
  const { isLoading, user, token, missingCredentials } = useRequireAuth();
  const { authFetch, unauthorized } = useAuth();
  const translateState = useStateTranslation();
  const params = useParams();
  const id = params.id;
  const t = useTranslations('ProjectDetails');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const serverIp = getServerIp();
  const userRole = user ? mapRoleToEnum(user.role) : undefined;
  const projectsSocket = useProjectsSocket(token);
  const {
    requestProject,
    subscribeProject,
    unsubscribeProject,
    onDetailUpdated,
    updateProjectState,
  } = projectsSocket;
  const [alert, setAlert] = useState<{
    title: string;
    text: string;
    show: boolean;
  }>({
    title: '',
    text: '',
    show: false,
  });

  const toProject = (detail: ProjectDetail): Project => {
    const customer = detail.customer
      ? {
          id: detail.customer.id,
          name: detail.customer.name,
          email: detail.customer.email,
          role: Role.CUSTOMER,
          isNewUser: false,
        }
      : ({ id: 0, name: '', email: '', role: Role.CUSTOMER, isNewUser: false } as const);

    const translator = detail.translator
      ? {
          id: detail.translator.id,
          name: detail.translator.name,
          email: detail.translator.email,
          role: Role.TRANSLATOR,
          isNewUser: false,
        }
      : undefined;

    return {
      ProjectId: detail.ProjectId,
      fileName: detail.fileName,
      languageCode: detail.languageCode,
      state: detail.state,
      createdAt: detail.createdAt,
      customer,
      translator,
      feedback: detail.feedback ?? undefined,
      hasTranslatedFile: Boolean(detail.hasTranslatedFile),
    };
  };

  const isUnauthorizedError = (err: unknown) =>
    err instanceof Error && err.message === 'Unauthorized';

  useEffect(() => {
    if (!id || !token) return;

    const projectId = Number(id);
    if (!projectId || Number.isNaN(projectId)) return;

    let cancelled = false;

    const load = async () => {
      try {
        await subscribeProject(projectId);
        const data = await requestProject(projectId);
        if (cancelled) return;
        setProject(toProject(data));
      } catch (err: unknown) {
        if (cancelled) return;
        console.error(err);
        setError(t('loadError'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const offDetail = onDetailUpdated((updated) => {
      if (updated?.ProjectId === projectId) {
        setProject(toProject(updated));
      }
    });

    load();

    return () => {
      cancelled = true;
      offDetail?.();
      unsubscribeProject(projectId).catch(() => undefined);
    };
  }, [id, token, t, requestProject, subscribeProject, unsubscribeProject, onDetailUpdated]);

  const handleUpdateState = (newState: ProjectState) => {
    if (!project) return;

    updateProjectState(project.ProjectId, newState)
      .then(() => {
        setAlert({
          title: t('sendSuccess'),
          text: t('updateSuccess') + ` ${translateState(newState)}`,
          show: true,
        });
      })
      .catch((err: unknown) => {
        if (isUnauthorizedError(err)) return;
        console.error(err);
        setAlert({
          title: t('error'),
          text: t('updateError'),
          show: true,
        });
      });
  };

  const handleSubmitFeedback = async (feedbackText: string) => {
    if (!project) return;
    try {
      await authFetch(`${serverIp}/projects/${project.ProjectId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: feedbackText }),
      });

      // UI updates come from WebSocket `projects:detailUpdated`.
      setAlert({
        title: t('sendSuccess'),
        text: t('feedbackSuccess'),
        show: true,
      });
    } catch (err: unknown) {
      if (!isUnauthorizedError(err)) {
        console.error(err);
        setAlert({
          title: t('error'),
          text: t('fetchError'),
          show: true,
        });
        throw err;
      }
    }
  };

  const handleUpload = async (file: File) => {
    if (!project) return;
    const formData = new FormData();
    formData.append('translatedFile', file);

    try {
      await authFetch(`${serverIp}/projects/${project.ProjectId}/file`, {
        method: 'POST',
        body: formData,
      });

      // UI updates come from WebSocket `projects:detailUpdated`.
      setAlert({
        title: t('sendSuccess'),
        text: t('uploadSuccess'),
        show: true,
      });
    } catch (err: unknown) {
      if (!isUnauthorizedError(err)) {
        console.error(err);
        setAlert({ title: t('error'), text: t('uploadError'), show: true });
        throw err;
      }
    }
  };

  const handleDownload = async (type: FileState) => {
    if (!project) return;
    try {
      await downloadProjectFile(serverIp, project.ProjectId, type, authFetch);
    } catch (err: unknown) {
      if (!isUnauthorizedError(err)) {
        console.error(err);
        setAlert({
          title: t('error'),
          text: t('downloadError'),
          show: true,
        });
      }
    }
  };

  if (missingCredentials || unauthorized) return <LoginRedirecter />;
  if (loading || isLoading) return <LoadingSpinner text={t('loading')} />;

  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div>{t('notFound')}</div>;

  return (
    <div className=" flex items-center justify-center bg-black">
      <Alert
        title={alert.title}
        text={alert.text}
        show={alert.show}
        onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
      />
      <div className="p-6 pt-10 text-black w-full max-w-3xl">
        <h1 className="text-2xl text-gray-200 font-bold mb-4">{t('title')}</h1>
        <div className="bg-white shadow rounded-lg p-6 space-y-6">
          <ProjectInfo project={project} onDownload={handleDownload} />

          <hr className="border-t border-gray-200 my-6" />

          <UserInfo
            titleKey="customer"
            user={project.customer}
            isCurrentUser={userRole === Role.CUSTOMER}
            isAdmin={userRole === Role.ADMINISTRATOR}
          />

          {project.translator && (
            <>
              <hr className="border-t border-gray-200 my-6" />
              <UserInfo
                titleKey="translator"
                user={project.translator}
                isCurrentUser={userRole === Role.TRANSLATOR}
                isAdmin={userRole === Role.ADMINISTRATOR}
              />
            </>
          )}

          <TranslatorActions
            userRole={userRole}
            project={project}
            onUpdateState={handleUpdateState}
            onUpload={handleUpload}
          />

          <AdminActions
            userRole={userRole}
            projectState={mapStateToEnum(project.state)}
            onUpdateState={handleUpdateState}
          />

          <AdminEmailPanel userRole={userRole} project={project} />

          <hr className="border-t border-gray-200 my-6" />

          <CustomerActions
            userRole={userRole}
            projectState={mapStateToEnum(project.state)}
            onUpdateState={handleUpdateState}
          />

          <FeedbackSection userRole={userRole} project={project} onSubmitFeedback={handleSubmitFeedback} />
        </div>
      </div>
    </div>
  );
}
