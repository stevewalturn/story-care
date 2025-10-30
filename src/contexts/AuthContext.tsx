'use client';

import type { User } from 'firebase/auth';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,

} from 'react';
import { auth, onAuthChange } from '@/libs/Firebase';

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
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // HIPAA COMPLIANCE: 15-minute idle timeout
  const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

  const handleSignOut = useCallback(async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, [router]);

  const resetIdleTimer = useCallback(() => {
    // Clear existing timer
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    // Only set timer if user is authenticated
    if (user) {
      idleTimerRef.current = setTimeout(() => {
        console.log('Session timed out due to inactivity');
        handleSignOut();
      }, IDLE_TIMEOUT);
    }
  }, [user, handleSignOut, IDLE_TIMEOUT]);

  // Set up idle timeout monitoring
  useEffect(() => {
    if (!user) return;

    // Events that indicate user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    // Reset timer on any user activity
    events.forEach(event => {
      window.addEventListener(event, resetIdleTimer);
    });

    // Start the timer
    resetIdleTimer();

    // Cleanup
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [user, resetIdleTimer]);

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
