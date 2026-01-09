import { UserInfo } from '../types/user';
import { useRouter } from '../i18n/navigation';
import { useState, useCallback } from 'react';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return 'Fetch error';
}

export const useAuth = () => {
  const router = useRouter();
  const [unauthorized, setUnauthorized] = useState(false);

  const handleLoginSuccess = useCallback(
    (data: { accessToken: string; user: UserInfo }) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.user.isNewUser) {
        router.push('/role-setup');
      } else {
        router.push('/dashboard');
      }
    },
    [router],
  );

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('user');

    if (!token || !user) {
      setUnauthorized(true);
      throw new Error('Unauthorized');
    }

    return { Authorization: `Bearer ${token}` };
  }, []);

  const handleResponseStatus = useCallback(async (res: Response) => {
    if (res.status === 401) {
      setUnauthorized(true);
      throw new Error('Unauthorized');
    }

    if (res.status === 204) {
      return;
    }

    if (!res.ok) {
      const text = await res.text();
      try {
        if (text) {
          const parsed: unknown = JSON.parse(text);
          if (parsed && typeof parsed === 'object' && 'message' in parsed) {
            const message = (parsed as { message?: unknown }).message;
            throw new Error(typeof message === 'string' ? message : 'Fetch error');
          }
        }
      } catch (error) {
        if (error instanceof Error) throw error;
      }

      throw new Error(text || 'Fetch error');
    }
  }, []);

  const parseResponse = useCallback(
    async (res: Response, responseType: 'json' | 'blob' | 'text') => {
      if (responseType === 'blob') {
        const blob = await res.blob();
        return { blob, headers: res.headers };
      }

      if (responseType === 'text') {
        return await res.text();
      }

      const text = await res.text();
      return text ? JSON.parse(text) : {};
    },
    [],
  );

  const authFetch = useCallback(
    async (
      url: string,
      options: RequestInit = {},
      responseType: 'json' | 'blob' | 'text' = 'json',
    ) => {
      try {
        const headers = getAuthHeaders();

        const res = await fetch(url, {
          ...options,
          headers: {
            ...(options.headers || {}),
            ...headers,
          },
        });

        await handleResponseStatus(res);

        return await parseResponse(res, responseType);
      } catch (err: unknown) {
        if (getErrorMessage(err) === 'Unauthorized') return;

        console.error('Auth fetch error:', err);
        throw err;
      }
    },
    [getAuthHeaders, handleResponseStatus, parseResponse],
  );

  return { handleLoginSuccess, authFetch, unauthorized };
};
