import { useTranslations } from 'next-intl';
import { Project } from '@/types/project';
import { ProjectState } from '@/constants/projectState';
import { FileState } from '@/constants/fileState';
import { ProjectStyleMapper } from '@/utils/ProjectStyleMapper';
import { useStateTranslation } from '@/hooks/useStateTranslation';
import InfoField from './InfoField';

interface ProjectInfoProps {
  project: Project;
  onDownload: (type: FileState) => void;
}

export default function ProjectInfo({ project, onDownload }: ProjectInfoProps) {
  const t = useTranslations('ProjectDetails');
  const translateState = useStateTranslation();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{t('file')}</h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
        <InfoField label={t('fileName')} value={project.fileName} />
        <InfoField label={t('language')} value={project.languageCode} />
        <InfoField
          label={t('state')}
          value={
            <span
              className={`px-3 py-1 rounded-full w-fit ${ProjectStyleMapper.getStyle(
                project.state,
              )}`}
            >
              {translateState(project.state)}
            </span>
          }
        />
        <InfoField
          label={t('createdAt')}
          value={new Date(project.createdAt).toLocaleDateString()}
        />
        <div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => onDownload(FileState.ORIGINAL)}
              className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 text-sm flex items-center gap-2 w-fit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              {t('downloadOriginal')}
            </button>
            {project.hasTranslatedFile && (
              <button
                onClick={() => onDownload(FileState.TRANSLATED)}
                className={`px-4 py-2 rounded hover:bg-lime-800 text-sm flex items-center gap-2 w-fit ${ProjectStyleMapper.getStyle(
                  ProjectState.COMPLETED,
                )}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                {t('downloadTranslated')}
              </button>
            )}
          </div>
          <div className="mt-4">
            <InfoField
              label={t('translatedFileStatus')}
              value={
                <span className={project.hasTranslatedFile ? 'text-green-600' : 'text-gray-700'}>
                  {project.hasTranslatedFile ? t('yes') : t('no')}
                </span>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
