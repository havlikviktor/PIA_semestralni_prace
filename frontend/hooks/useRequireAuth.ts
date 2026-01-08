import { useEffect, useState } from 'react';
import { UserInfo } from '@/types/user';

export const useRequireAuth = () => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [missingCredentials, setMissingCredentials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setIsLoading(true);
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (!storedUser || !storedToken) {
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setUser(null);
      setToken(null);
      setMissingCredentials(true);
      setIsLoading(false);
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setToken(storedToken);
      setMissingCredentials(false);
    } catch (error) {
      console.error('Invalid user data in localStorage');
      localStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      setUser(null);
      setToken(null);
      setMissingCredentials(true);
    } finally {
      setIsLoading(false);
    }

    // Note: in React 18 StrictMode this effect may run twice in dev.
  }, []);

  return { user, token, isLoading, missingCredentials };
};
