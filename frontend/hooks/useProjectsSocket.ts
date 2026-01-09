'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  ProjectDetail,
  ProjectListItem,
  ProjectSocketEvent,
  ProjectStateChangedPayload,
} from '@/constants/projectSocketEvents';
import { ProjectState } from '@/constants/projectState';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'string' && err) return err;
  return fallback;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });

  return Promise.race([promise, timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function ensureConnected(socket: Socket, ms: number) {
  if (socket.connected) return Promise.resolve();

  const promise = new Promise<void>((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: unknown) => {
      cleanup();
      reject(err instanceof Error ? err : new Error(getErrorMessage(err, 'Socket connect error')));
    };

    const cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
  });

  return withTimeout(promise, ms, 'socket:connect');
}

export function useProjectsSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastError, setLastError] = useState<string>('');

  useEffect(() => {
    if (!token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      Promise.resolve().then(() => {
        setConnected(false);
        setLastError('');
      });
      return;
    }

    const socket = io(`${SOCKET_URL}/projects`, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      reconnectionDelayMax: 4000,
      timeout: 8000,
    });

    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      setLastError('');
    };

    const onDisconnect = (reason: string) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server kicked us; allow manual reconnect by re-creating socket on next render.
      }
    };

    const onConnectError = (err: unknown) => {
      setConnected(false);
      setLastError(getErrorMessage(err, 'Socket connect error'));
    };

    const onUnauthorized = (payload: { message?: string }) => {
      setLastError(payload?.message || 'Unauthorized');
      socket.disconnect();
    };

    const onError = (payload: { message?: string }) => {
      setLastError(payload?.message || 'Socket error');
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on(ProjectSocketEvent.Unauthorized, onUnauthorized);
    socket.on(ProjectSocketEvent.Error, onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off(ProjectSocketEvent.Unauthorized, onUnauthorized);
      socket.off(ProjectSocketEvent.Error, onError);
      socket.disconnect();
    };
  }, [token]);

  const emitRequest = useCallback(<TResponse, TBody = undefined>(event: string, body?: TBody) => {
    const socket = socketRef.current;
    if (!socket) {
      return Promise.reject(new Error('Socket not initialized'));
    }

    const promise = (async () => {
      await ensureConnected(socket, 8000);

      return await new Promise<TResponse>((resolve, reject) => {
        let settled = false;

        const finishResolve = (resp: TResponse) => {
          if (settled) return;
          settled = true;
          cleanup();
          resolve(resp);
        };

        const finishReject = (err: unknown) => {
          if (settled) return;
          settled = true;
          cleanup();
          reject(
            err instanceof Error ? err : new Error(getErrorMessage(err, 'Socket request failed')),
          );
        };

        // Fallback path: some setups respond by emitting the same event name back.
        const onEventResponse = (resp: TResponse) => {
          finishResolve(resp);
        };

        const cleanup = () => {
          socket.off(event, onEventResponse);
        };

        socket.once(event, onEventResponse);

        try {
          // Preferred path: Socket.IO ack callback.
          // If server doesn't use acks, the fallback listener above will catch the emitted response.
          const emitWithAck = (payload: TBody | undefined) => {
            if (typeof payload === 'undefined') {
              socket.timeout(8000).emit(event, (err: unknown, resp: TResponse) => {
                if (err) {
                  // Let fallback possibly resolve; otherwise reject.
                  setTimeout(() => finishReject(err), 0);
                  return;
                }
                finishResolve(resp);
              });
              return;
            }

            socket.timeout(8000).emit(event, payload, (err: unknown, resp: TResponse) => {
              if (err) {
                setTimeout(() => finishReject(err), 0);
                return;
              }
              finishResolve(resp);
            });
          };

          emitWithAck(body);
        } catch (e) {
          finishReject(e);
        }
      });
    })();

    return withTimeout(promise, 8000, event);
  }, []);

  const requestList = useCallback(() => {
    return emitRequest<ProjectListItem[]>(ProjectSocketEvent.ProjectsListRequest);
  }, [emitRequest]);

  const requestProject = useCallback(
    (projectId: number) => {
      return emitRequest<ProjectDetail, { projectId: number }>(
        ProjectSocketEvent.ProjectGetRequest,
        { projectId },
      );
    },
    [emitRequest],
  );

  const subscribeProject = useCallback(
    (projectId: number) => emitRequest(ProjectSocketEvent.ProjectSubscribeRequest, { projectId }),
    [emitRequest],
  );

  const unsubscribeProject = useCallback(
    (projectId: number) => emitRequest(ProjectSocketEvent.ProjectUnsubscribeRequest, { projectId }),
    [emitRequest],
  );

  const updateProjectState = useCallback(
    (projectId: number, state: ProjectState) =>
      emitRequest<ProjectDetail, { projectId: number; state: ProjectState }>(
        ProjectSocketEvent.ProjectUpdateStateRequest,
        { projectId, state },
      ),
    [emitRequest],
  );

  const onListItemCreated = useCallback((cb: (p: ProjectListItem) => void) => {
    socketRef.current?.on(ProjectSocketEvent.ProjectListItemCreated, cb);
    return () => socketRef.current?.off(ProjectSocketEvent.ProjectListItemCreated, cb);
  }, []);

  const onListItemUpdated = useCallback((cb: (p: ProjectListItem) => void) => {
    socketRef.current?.on(ProjectSocketEvent.ProjectListItemUpdated, cb);
    return () => socketRef.current?.off(ProjectSocketEvent.ProjectListItemUpdated, cb);
  }, []);

  const onStateChanged = useCallback((cb: (p: ProjectStateChangedPayload) => void) => {
    socketRef.current?.on(ProjectSocketEvent.ProjectStateChanged, cb);
    return () => socketRef.current?.off(ProjectSocketEvent.ProjectStateChanged, cb);
  }, []);

  const onDetailUpdated = useCallback((cb: (p: ProjectDetail) => void) => {
    socketRef.current?.on(ProjectSocketEvent.ProjectDetailUpdated, cb);
    return () => socketRef.current?.off(ProjectSocketEvent.ProjectDetailUpdated, cb);
  }, []);

  const getSocket = useCallback(() => socketRef.current, []);

  const api = useMemo(
    () => ({
      connected,
      lastError,
      requestList,
      requestProject,
      subscribeProject,
      unsubscribeProject,
      updateProjectState,
      onListItemCreated,
      onListItemUpdated,
      onStateChanged,
      onDetailUpdated,
      getSocket,
    }),
    [
      connected,
      lastError,
      requestList,
      requestProject,
      subscribeProject,
      unsubscribeProject,
      updateProjectState,
      onListItemCreated,
      onListItemUpdated,
      onStateChanged,
      onDetailUpdated,
      getSocket,
    ],
  );

  return api;
}
