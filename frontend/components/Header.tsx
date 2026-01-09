'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, useRouter, usePathname } from '../i18n/navigation';
import { useRoleTranslation } from '../hooks/useRoleTranslation';
import LanguageSwitcher from './LanguageSwitcher';
import { Role } from '../constants/role';
import { mapRoleToEnum } from '../utils/RoleMapper';

export default function Header() {
  const t = useTranslations('Dashboard');
  const translateRole = useRoleTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLoginPage = pathname === '/';
  const userRole = user ? mapRoleToEnum(user.role) : null;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        const normalized =
          parsed && typeof parsed === 'object' && 'user' in parsed ? (parsed as any).user : parsed;

        setUser(normalized);
      } catch (e) {
        console.error('Failed to parse user data', e);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setUser(null);
    router.push('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-stone-900 shadow-sm border-b border-gray-800">
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4 md:space-x-8">
            {user && !isLoginPage && (
              <>
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-800 p-2 rounded-full">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-300"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{user.name}</span>
                    <span className="text-xs text-gray-400 capitalize">
                      {translateRole(user.role)}
                    </span>
                  </div>
                </div>

                <nav className="hidden md:flex items-center space-x-4">
                  <Link
                    href="/dashboard"
                    className={`text-sm font-medium ${
                      pathname === '/dashboard'
                        ? 'text-white underline underline-offset-4'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t('dashboard')}
                  </Link>
                  <Link
                    href="/projects"
                    className={`text-sm font-medium ${
                      pathname === '/projects'
                        ? 'text-white underline underline-offset-4'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {t('projects')}
                  </Link>
                  {(userRole === Role.ADMINISTRATOR || userRole === Role.CUSTOMER) && (
                    <Link
                      href="/projects/new"
                      className={`text-sm font-medium ${
                        pathname === '/projects/new'
                          ? 'text-white underline underline-offset-4'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('newProject')}
                    </Link>
                  )}
                  <Link
                    href="/projects/active"
                    className={`text-sm font-medium ${
                      pathname === '/projects/active'
                        ? 'text-white underline underline-offset-4'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {userRole === Role.TRANSLATOR
                      ? t('projectsToTranslate')
                      : t('projectsToApproval')}
                  </Link>
                  {userRole === Role.ADMINISTRATOR && (
                    <Link
                      href="/projects/manage"
                      className={`text-sm font-medium ${
                        pathname === '/projects/manage'
                          ? 'text-white underline underline-offset-4'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('manageProjects')}
                    </Link>
                  )}
                </nav>

                <button
                  onClick={toggleMenu}
                  className="md:hidden text-gray-300 hover:text-white focus:outline-none"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {isMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {user && !isLoginPage && (
              <button
                onClick={handleLogout}
                className="text-gray-200 hover:text-white text-sm font-medium"
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && user && !isLoginPage && (
        <div className="md:hidden border-t border-gray-800 px-4 py-2">
          <nav className="flex flex-col space-y-2">
            <Link
              href="/dashboard"
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/dashboard'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {t('dashboard')}
            </Link>
            <Link
              href="/projects"
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/projects'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {t('projects')}
            </Link>
            {(userRole === Role.ADMINISTRATOR || userRole === Role.CUSTOMER) && (
              <Link
                href="/projects/new"
                onClick={closeMenu}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/projects/new'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {t('newProject')}
              </Link>
            )}
            {userRole === Role.ADMINISTRATOR && (
              <Link
                href="/projects/manage"
                onClick={closeMenu}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  pathname === '/projects/manage'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {t('manageProjects')}
              </Link>
            )}
            <Link
              href="/projects/active"
              onClick={closeMenu}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/projects/active'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {userRole === Role.TRANSLATOR ? t('projectsToTranslate') : t('projectsToApproval')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
