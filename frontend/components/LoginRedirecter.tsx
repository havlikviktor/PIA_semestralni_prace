import { useTranslations } from 'next-intl';
import { Link } from '../i18n/navigation';

export default function LoginRedirecter() {
  const t = useTranslations('Dashboard');

  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">{t('authError')}</h1>
      <Link href="/" className="text-blue-300 hover:text-white underline text-lg">
        {t('loginAgain')}
      </Link>
    </div>
  );
}
