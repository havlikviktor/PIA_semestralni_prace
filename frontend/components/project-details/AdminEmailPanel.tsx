import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Project } from '@/types/project';
import { Role } from '@/constants/role';
import { useAuth } from '@/hooks/useAuth';
import { getServerUrl } from '@/utils/getServerURL';
import Alert from '@/components/Alert';

interface AdminEmailPanelProps {
  userRole?: Role;
  project: Project;
}

export default function AdminEmailPanel({ userRole, project }: AdminEmailPanelProps) {
  const t = useTranslations('ProjectDetails');
  const { authFetch } = useAuth();
  const serverUrl = getServerUrl();

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendToCustomer, setSendToCustomer] = useState(false);
  const [sendToTranslator, setSendToTranslator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    title: string;
    text: string;
    show: boolean;
  }>({
    title: '',
    text: '',
    show: false,
  });

  if (userRole !== Role.ADMINISTRATOR) {
    return null;
  }

  const handleSend = async () => {
    const recipients: string[] = [];
    if (sendToCustomer && project.customer.email) {
      recipients.push(project.customer.email);
    }
    if (sendToTranslator && project.translator?.email) {
      recipients.push(project.translator.email);
    }

    if (recipients.length === 0) {
      setAlert({
        title: t('error'),
        text: t('selectRecipient'),
        show: true,
      });
      return;
    }

    if (!subject || !message) {
      setAlert({
        title: t('error'),
        text: t('fillAllFields'),
        show: true,
      });
      return;
    }

    setLoading(true);
    try {
      await authFetch(`${serverUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipients,
          subject,
          text: message,
        }),
      });

      setAlert({
        title: t('sendSuccess'),
        text: t('emailSent'),
        show: true,
      });
      setSubject('');
      setMessage('');
      setSendToCustomer(false);
      setSendToTranslator(false);
    } catch (err) {
      console.error(err);
      setAlert({
        title: t('error'),
        text: t('emailError'),
        show: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Alert
        title={alert.title}
        text={alert.text}
        show={alert.show}
        onClose={() => setAlert((prev) => ({ ...prev, show: false }))}
      />
      <h2 className="text-xl font-semibold">{t('adminEmailPanel')}</h2>
      <div className="space-y-2">
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={sendToCustomer}
              onChange={(e) => setSendToCustomer(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>
              {t('customer')} ({project.customer.email})
            </span>
          </label>
          {project.translator && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={sendToTranslator}
                onChange={(e) => setSendToTranslator(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                {t('translator')} ({project.translator.email})
              </span>
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('subject')}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">{t('message')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
          />
        </div>

        <button
          onClick={handleSend}
          disabled={loading}
          className="text-white  text-sm bg-gray-900 hover:bg-gray-700 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm font-medium rounded-md disabled:opacity-50"
        >
          {loading ? t('sending') : t('sendEmail')}
        </button>
      </div>
    </div>
  );
}
