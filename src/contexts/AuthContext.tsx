'use client';

import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useEffect,
  useState,

} from 'react';
import { onAuthChange } from '@/libs/Firebase';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => {
  const context = use(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser) => {
      setUser(authUser);
      setLoading(false);

      // Set or clear session cookie based on auth state
      if (authUser) {
        try {
          const idToken = await authUser.getIdToken();
          // Set session cookie via API route
          await fetch('/api/auth/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
        } catch (error) {
          console.error('Failed to set session cookie:', error);
        }
      } else {
        // Clear session cookie when user signs out
        try {
          await fetch('/api/auth/session', { method: 'DELETE' });
        } catch (error) {
          console.error('Failed to clear session cookie:', error);
        }

        // Redirect to sign-in if not on a public path
        if (typeof window !== 'undefined') {
          const publicPaths = ['/sign-in', '/sign-up', '/'];
          const currentPath = window.location.pathname;
          if (!publicPaths.some(path => currentPath.includes(path))) {
            router.push('/sign-in');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <AuthContext value={{ user, loading }}>
      {children}
    </AuthContext>
  );
}
