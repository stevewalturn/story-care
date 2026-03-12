'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type FeatureFlags = {
  enablePhoneVerification: boolean;
};

const defaultFlags: FeatureFlags = {
  enablePhoneVerification: false,
};

export function useFeatureFlags(): FeatureFlags {
  const { user } = useAuth();
  const [flags, setFlags] = useState<FeatureFlags>(defaultFlags);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then((token) => {
      fetch('/api/features', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(r => r.json())
        .then((data) => {
          setFlags({ enablePhoneVerification: data.enablePhoneVerification ?? false });
        })
        .catch(() => {});
    });
  }, [user]);

  return flags;
}
