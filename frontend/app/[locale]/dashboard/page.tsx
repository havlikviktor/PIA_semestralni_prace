'use client';

import { useTranslations } from 'next-intl';
import DashboardButton from '../../../components/DashboardButton';
import { mapRoleToEnum } from '../../../utils/RoleMapper';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import LoadingSpinner from '@/components/LoadingSpinner';
import LoginRedirecter from '@/components/LoginRedirecter';
import { Role } from '@/constants/role';

export default function Dashboard() {
  const t = useTranslations('Dashboard');
  const { user, isLoading, missingCredentials } = useRequireAuth();

  if (isLoading) {
    return <LoadingSpinner text={t('loading')} />;
  }

  const userRole = user ? mapRoleToEnum(user.role) : null;
  if (missingCredentials || !userRole) {
    return <LoginRedirecter />;
  }

  return (
    <div className="w-full bg-black text-white flex flex-col items-center justify-center p-12">
      <h1 className="text-4xl font-bold mb-4">{t('welcome')}</h1>
      <p className="text-xl mb-12 text-gray-400">{t('loggedIn')}</p>

      <div className="flex flex-wrap justify-center gap-4 w-full max-w-5xl">
        {(userRole === Role.CUSTOMER ||
          userRole === Role.TRANSLATOR) && (
          <div className="w-[calc(50%-8px)] sm:w-36 md:w-44 lg:w-52">
            <DashboardButton title={t('projects')} href="/projects" imageSrc="/img/projects.png" />
          </div>
        )}

        {(userRole === Role.CUSTOMER) && (
          <div className="w-[calc(50%-8px)] sm:w-36 md:w-44 lg:w-52">
            <DashboardButton
              title={t('newProject')}
              href="/projects/new"
              imageSrc="/img/newProject1.png"
            />
          </div>
        )}

        {(userRole === Role.CUSTOMER ||
          userRole === Role.TRANSLATOR) && (
          <div className="w-[calc(50%-8px)] sm:w-36 md:w-44 lg:w-52">
            <DashboardButton
              title={
                userRole === Role.TRANSLATOR ? t('projectsToTranslate') : t('projectsToApproval')
              }
              href="/projects/active"
              imageSrc="/img/ongoingProjects.png"
            />
          </div>
        )}

        {userRole === Role.ADMINISTRATOR && (
          <div className="w-[calc(50%-8px)] sm:w-36 md:w-44 lg:w-52">
            <DashboardButton
              title={t('manageProjects')}
              href="/projects/manage"
              imageSrc="/img/manageProjects1.png"
            />
          </div>
        )}
      </div>
    </div>
  );
}
