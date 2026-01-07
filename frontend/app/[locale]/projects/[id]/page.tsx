'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import LoginRedirecter from '@/components/LoginRedirecter';
import { getServerIp } from '@/utils/getServerIp';
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

export default function ProjectPage() {
  const { isLoading, user, missingCredentials } = useRequireAuth();
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
  const [alert, setAlert] = useState<{
    title: string;
    text: string;
    show: boolean;
  }>({
    title: '',
    text: '',
    show: false,
  });

  useEffect(() => {
    if (!id) return;

    const fetchProject = async () => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      try {
        const data = await authFetch(`${serverIp}/projects/${id}`, {
          signal: controller.signal,
        });
        setProject(data);
      } catch (err: any) {
        if (err.message !== 'Unauthorized') {
          console.error(err);
          setError(t('loadError'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, t, serverIp, authFetch]);

  const handleUpdateState = async (newState: ProjectState) => {
    if (!project) return;
    try {
      const updatedProject = await authFetch(`${serverIp}/projects/${project.ProjectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: newState }),
      });

      setProject(updatedProject);
      setAlert({
        title: t('sendSuccess'),
        text: t('updateSuccess') + ` ${translateState(newState)}`,
        show: true,
      });
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        console.error(err);
        setAlert({
          title: t('error'),
          text: t('updateError'),
          show: true,
        });
      }
    }
  };

  const handleSubmitFeedback = async (feedbackText: string) => {
    if (!project) return;
    try {
      const newFeedback = await authFetch(`${serverIp}/projects/${project.ProjectId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: feedbackText }),
      });

      setProject({ ...project, feedback: newFeedback });
      setAlert({
        title: t('sendSuccess'),
        text: t('feedbackSuccess'),
        show: true,
      });
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
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
      const updatedProject = await authFetch(`${serverIp}/projects/${project.ProjectId}/file`, {
        method: 'POST',
        body: formData,
      });

      setProject(updatedProject);
      setAlert({
        title: t('sendSuccess'),
        text: t('uploadSuccess'),
        show: true,
      });
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
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
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
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
  if (loading || isLoading) return <LoginRedirecter />;

  if (error) return <div className="text-red-500">{error}</div>;
  if (!project) return <div>{t('notFound')}</div>;

  return (
    <div className=" flex items-center justify-center bg-black">
      {userRole !== Role.ADMINISTRATOR && (
        <Alert
          title={alert.title}
          text={alert.text}
          show={alert.show}
          onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
        />
      )}
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

          <FeedbackSection project={project} onSubmitFeedback={handleSubmitFeedback} />
        </div>
      </div>
    </div>
  );
}
