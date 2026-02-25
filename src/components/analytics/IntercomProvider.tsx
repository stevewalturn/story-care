'use client';

import { useCallback, useEffect, useRef } from 'react';
import { IntercomProvider as ReactIntercomProvider, useIntercom } from 'react-use-intercom';
import { useAuth } from '@/contexts/AuthContext';
import { Env } from '@/libs/Env';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

async function fetchToken(firebaseIdToken: string): Promise<{ token: string; expiresIn: number } | null> {
  try {
    const response = await fetch('/api/intercom/token', {
      headers: { Authorization: `Bearer ${firebaseIdToken}` },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function IntercomBootstrap() {
  const { user, dbUser } = useAuth();
  const { boot, shutdown, update } = useIntercom();
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!dbUser || !user) {
      clearRefreshTimer();
      shutdown();
      return;
    }

    let cancelled = false;

    function scheduleRefresh(expiresIn: number) {
      const refreshMs = expiresIn * 1000 - TOKEN_REFRESH_BUFFER_MS;
      if (refreshMs <= 0 || cancelled) return;

      // Clear any previous timer before scheduling a new one
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // eslint-disable-next-line react-web-api/no-leaked-timeout -- cleaned via refreshTimerRef in effect cleanup
      const timerId = setTimeout(async () => {
        if (cancelled || !user) return;
        try {
          const idToken = await user.getIdToken();
          const result = await fetchToken(idToken);
          if (result && !cancelled) {
            update({ intercomUserJwt: result.token });
            scheduleRefresh(result.expiresIn);
          }
        } catch {
          // Token refresh failed; widget continues with previous token
        }
      }, refreshMs);
      refreshTimerRef.current = timerId;
    }

    (async () => {
      const idToken = await user.getIdToken();
      const result = await fetchToken(idToken);

      if (cancelled) return;

      if (result) {
        // JWT available: boot with signed identity (email inside JWT)
        boot({
          userId: dbUser.id,
          name: dbUser.name ?? undefined,
          intercomUserJwt: result.token,
          customAttributes: {
            role: dbUser.role,
            organization_id: dbUser.organizationId ?? undefined,
          },
        });
        scheduleRefresh(result.expiresIn);
      } else {
        // Graceful degradation: boot with plain attributes
        boot({
          userId: dbUser.id,
          email: dbUser.email ?? undefined,
          name: dbUser.name ?? undefined,
          customAttributes: {
            role: dbUser.role,
            organization_id: dbUser.organizationId ?? undefined,
          },
        });
      }
    })();

    return () => {
      cancelled = true;
      clearRefreshTimer();
    };
  }, [dbUser, user, boot, shutdown, update, clearRefreshTimer]);

  return null;
}

export function IntercomProvider({ children }: { children: React.ReactNode }) {
  const appId = Env.NEXT_PUBLIC_INTERCOM_APP_ID;

  if (!appId) {
    return children;
  }

  return (
    <ReactIntercomProvider appId={appId} autoBoot={false}>
      <IntercomBootstrap />
      {children}
    </ReactIntercomProvider>
  );
}
