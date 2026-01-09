'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from '../../../i18n/navigation';
import { Language } from '../../../constants/languages';
import { useTranslations, useLocale } from 'next-intl';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import LoginRedirecter from '@/components/LoginRedirecter';
import { getServerUrl } from '@/utils/getServerURL';
import { Role } from '@/constants/role';

function RoleSetupContent() {
  const t = useTranslations('Auth');
  const tSetup = useTranslations('RoleSetup');
  const locale = useLocale();
  const router = useRouter();
  const { user, missingCredentials } = useRequireAuth();
  const { authFetch, unauthorized } = useAuth();

  const [role, setRole] = useState(Role.CUSTOMER);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>([]);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const serverUrl = getServerUrl();

  useEffect(() => {
    if (user) {
      if (user.id) {
        setUserId(user.id);
      } else {
        setError(t('userIdNotFound'));
      }
    }
  }, [user]);

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId) return;

    let body: any = { role };

    if (role === Role.TRANSLATOR) {
      body.languages = selectedLanguages;
    }

    try {
      const updatedUser = await authFetch(`${serverUrl}/user/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (updatedUser) {
        if (updatedUser.accessToken) {
          localStorage.setItem('accessToken', updatedUser.accessToken);
        }

        // Store user without token field (backend may return either user fields directly or { user, accessToken })
        const userToStore = updatedUser.user ? updatedUser.user : updatedUser;
        const { accessToken, ...userWithoutToken } = userToStore;
        localStorage.setItem('user', JSON.stringify(userWithoutToken));
      }

      router.push('/dashboard');
    } catch (err: any) {
      if (err.message !== 'Unauthorized') {
        setError(err.message);
      }
    }
  };

  if (missingCredentials || unauthorized) {
    return <LoginRedirecter />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">{tSetup('title')}</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('roleLabel')}</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-black"
            >
              <option value={Role.CUSTOMER}>{t('customerRole')}</option>
              <option value={Role.TRANSLATOR}>{t('translatorRole')}</option>
            </select>
          </div>

          {role === Role.TRANSLATOR && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('languagesLabel')}
              </label>
              <div className="h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {Object.values(Language).map((lang) => (
                  <div key={lang} className="flex items-center mb-1">
                    <input
                      type="checkbox"
                      id={`lang-${lang}`}
                      checked={selectedLanguages.includes(lang)}
                      onChange={() => handleLanguageChange(lang)}
                      className="mr-2"
                    />
                    <label htmlFor={`lang-${lang}`} className="text-sm text-gray-700">
                      {new Intl.DisplayNames([locale], {
                        type: 'language',
                      }).of(lang)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {tSetup('submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RoleSetupPage() {
  const t = useTranslations('Auth');
  return (
    <Suspense fallback={<div>{t('loading')}</div>}>
      <RoleSetupContent />
    </Suspense>
  );
}
