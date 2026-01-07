import { useTranslations } from 'next-intl';

export default function LoginRedirecter() {
  const t = useTranslations('Dashboard');

  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t('authError')}</h1>
      <a href="/" className="text-blue-300 hover:text-white underline text-lg">
        {t('loginAgain')}
      </a>
    </div>
  );
}
