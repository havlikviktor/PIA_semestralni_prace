import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ProjectState } from '@/constants/projectState';
import { Project } from '@/types/project';
import { mapStateToEnum } from '@/utils/StateMapper';

interface FeedbackSectionProps {
  project: Project;
  onSubmitFeedback: (text: string) => Promise<void>;
}

export default function FeedbackSection({ project, onSubmitFeedback }: FeedbackSectionProps) {
  const t = useTranslations('ProjectDetails');
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitFeedback(feedbackText);
      setFeedbackText('');
    } finally {
      setSubmitting(false);
    }
  };

  if (project.state === ProjectState.CREATED || project.state === ProjectState.ASSIGNED) {
    return;
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-2">{t('feedback')}</h2>
      {project.feedback ? (
        <div className="bg-gray-50 p-4 rounded">
          <p>{project.feedback.text}</p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(project.feedback.createdAt).toLocaleDateString()}
          </p>
        </div>
      ) : [ProjectState.APPROVED, ProjectState.REJECTED].includes(mapStateToEnum(project.state)) ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            className="w-full border rounded p-2"
            placeholder={t('feedbackPlaceholder')}
            rows={4}
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:bg-zinc-300"
          >
            {submitting ? t('loading') : t('submitFeedback')}
          </button>
        </form>
      ) : (
        <p className="text-gray-500">{t('noFeedback')}</p>
      )}
    </div>
  );
}
