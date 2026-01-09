import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from './useAuth';
import { useTranslations } from 'next-intl';
import { getServerUrl } from '@/utils/getServerURL';

export const useTicketLogin = () => {
  const t = useTranslations('Auth');
  const searchParams = useSearchParams();
  const { handleLoginSuccess } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const ticketProcessed = useRef(false);
  const serverUrl = getServerUrl();

  useEffect(() => {
    const ticket = searchParams.get('ticket');

    if (!ticket) {
      setIsLoading(false);
      return;
    }

    // mam to zde je pro vyvoj kdy se useefekt zavola 2x
    if (ticketProcessed.current) return;
    ticketProcessed.current = true;

    const exchangeTicket = async () => {
      try {
        const res = await fetch(`${serverUrl}/auth/ticket`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticket }),
        });

        if (!res.ok) throw new Error(t('invalidTicket'));

        const data = await res.json();
        if (data.accessToken) {
          handleLoginSuccess(data);
        } else {
          throw new Error(t('tokenNotReceived'));
        }
      } catch (err: unknown) {
        console.error(err);
        const message =
          err instanceof Error
            ? err.message
            : err && typeof err === 'object' && 'message' in err
            ? (err as { message?: unknown }).message
            : undefined;
        setError(typeof message === 'string' ? message : t('loginFailed'));
      } finally {
        setIsLoading(false);
      }
    };

    exchangeTicket();
  }, [searchParams, handleLoginSuccess, t, serverUrl]);

  return { isLoading, error };
};
