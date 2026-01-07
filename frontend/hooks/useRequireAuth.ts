import { useEffect, useState } from 'react';
import { useRouter } from '../i18n/navigation';
import { UserInfo } from '@/types/user';

export const useRequireAuth = () => {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [missingCredentials, setMissingCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (!storedUser || !storedToken) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setMissingCredentials(true);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
    } catch (error) {
      console.error('Invalid user data in localStorage');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return { user, token, isLoading, missingCredentials };
};
