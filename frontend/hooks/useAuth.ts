import { UserInfo } from '../types/user';
import { useRouter } from '../i18n/navigation';
import { useState, useCallback } from 'react';

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
      let errorObj: any = { message: 'Fetch error' };

      try {
        if (text) {
          errorObj = JSON.parse(text);
        }
      } catch (e) {
        errorObj = { message: text };
      }

      throw errorObj;
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
      } catch (e: any) {
        if (e.message === 'Unauthorized') return;

        console.error('Auth fetch error:', e);
        throw e;
      }
    },
    [getAuthHeaders, handleResponseStatus, parseResponse],
  );

  return { handleLoginSuccess, authFetch, unauthorized };
};
