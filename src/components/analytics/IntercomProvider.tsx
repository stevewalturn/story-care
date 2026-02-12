'use client';

import { useEffect } from 'react';
import { IntercomProvider as ReactIntercomProvider, useIntercom } from 'react-use-intercom';
import { useAuth } from '@/contexts/AuthContext';
import { Env } from '@/libs/Env';

function IntercomBootstrap() {
  const { dbUser } = useAuth();
  const { boot, shutdown } = useIntercom();

  useEffect(() => {
    if (dbUser) {
      boot({
        userId: dbUser.id,
        email: dbUser.email ?? undefined,
        name: dbUser.name ?? undefined,
        customAttributes: {
          role: dbUser.role,
          organization_id: dbUser.organizationId ?? undefined,
          firebase_uid: dbUser.uid,
        },
      });
    }
    else {
      shutdown();
    }
  }, [dbUser, boot, shutdown]);

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
