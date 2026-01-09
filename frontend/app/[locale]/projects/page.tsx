'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { useStateTranslation } from '@/hooks/useStateTranslation';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginRedirecter from '@/components/LoginRedirecter';
import { FileState } from '@/constants/fileState';
import { ProjectStyleMapper } from '@/utils/ProjectStyleMapper';
import { downloadProjectFile } from '@/utils/fileDownloader';
import { useProjectsSocket } from '@/hooks/useProjectsSocket';
import { ProjectListItem } from '@/constants/projectSocketEvents';
import { getServerIp } from '@/utils/getServerIp';

function isUnauthorizedError(err: unknown) {
  return err instanceof Error && err.message === 'Unauthorized';
}

export default function Projects() {
  const t = useTranslations('Projects');
  const translateState = useStateTranslation();
  const { authFetch, unauthorized } = useAuth();
  const router = useRouter();
  const { missingCredentials, token } = useRequireAuth();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const serverIp = getServerIp();
  const projectsSocket = useProjectsSocket(token);

  const { requestList, onListItemCreated, onListItemUpdated, onStateChanged } = projectsSocket;

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        const data = await requestList();
        if (cancelled) return;
        setProjects(data);
      } catch (err: unknown) {
        if (cancelled) return;
        console.error(err);
        setError(t('failedToLoad'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    const upsert = (incoming: ProjectListItem) => {
      setProjects((prev) => {
        const idx = prev.findIndex((p) => p.ProjectId === incoming.ProjectId);
        if (idx === -1) return [incoming, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      });
    };

    load();
    const offCreated = onListItemCreated(upsert);
    const offUpdated = onListItemUpdated(upsert);
    const offState = onStateChanged((p) => upsert(p.listItem));

    return () => {
      cancelled = true;
      offCreated?.();
      offUpdated?.();
      offState?.();
    };
  }, [t, token, requestList, onListItemCreated, onListItemUpdated, onStateChanged]);

  if (missingCredentials || unauthorized) {
    return <LoginRedirecter />;
  }

  if (isLoading) {
    return <LoadingSpinner text={t('loading')} />;
  }

  const handleDownload = async (e: React.MouseEvent, projectId: number, type: FileState) => {
    e.stopPropagation();

    try {
      await downloadProjectFile(serverIp, projectId, type, authFetch);
    } catch (err: unknown) {
      if (!isUnauthorizedError(err)) {
        console.error(err);
        setError(t('downloadError'));
      }
    }
  };

  return (
    <div className="w-full bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{t('title')}</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="bg-stone-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-800 text-gray-400 uppercase text-sm">
                <tr>
                  <th className="px-6 py-3">{t('number')}</th>
                  <th className="px-6 py-3">{t('state')}</th>
                  <th className="px-6 py-3">{t('language')}</th>
                  <th className="px-6 py-3">{t('fileTitle')}</th>
                  <th className="px-6 py-3">{t('createdAt')}</th>
                  <th className="px-6 py-3">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {t('noProjects')}
                    </td>
                  </tr>
                ) : (
                  projects.map((project, index) => (
                    <tr
                      key={project.ProjectId}
                      className="hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/projects/${project.ProjectId}`)}
                    >
                      <td className="px-6 py-4 text-gray-400">{index + 1}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${ProjectStyleMapper.getStyle(
                            project.state,
                          )}`}
                        >
                          {translateState(project.state)}
                        </span>
                      </td>
                      <td className="px-6 py-4">{project.languageCode}</td>
                      <td className="px-6 py-4 font-medium">{project.fileName}</td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <button
                          onClick={(e) => handleDownload(e, project.ProjectId, FileState.ORIGINAL)}
                          className="text-gray-400 hover:text-white transition-colors"
                          title={t('downloadOriginal')}
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
                        {project.hasTranslatedFile && (
                          <button
                            onClick={(e) =>
                              handleDownload(e, project.ProjectId, FileState.TRANSLATED)
                            }
                            className="text-green-400 hover:text-green-300 transition-colors"
                            title={t('downloadTranslated')}
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
    </div>
  );
}
