import { useEffect, useState } from 'react';
import { UserInfo } from '@/types/user';

function normalizeStoredUser(raw: unknown): UserInfo | null {
  if (!raw || typeof raw !== 'object') return null;

  const maybeWrapped = raw as { user?: unknown };
  const candidate = maybeWrapped.user && typeof maybeWrapped.user === 'object' ? maybeWrapped.user : raw;
  const u = candidate as Partial<UserInfo>;

  if (typeof u.id !== 'number') return null;
  if (typeof u.name !== 'string') return null;
  if (typeof u.role !== 'string') return null;
  if (typeof u.email !== 'string') return null;

  return u as UserInfo;
}

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
