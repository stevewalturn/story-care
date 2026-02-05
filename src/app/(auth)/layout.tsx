'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { MobileHeader } from '@/components/layout/MobileHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/useIsMobile';

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Check if user is a patient on mobile - simplified layout
  const isPatientOnMobile = isMobile && dbUser?.role === 'patient';

  // Toaster configuration shared across layouts
  const toasterConfig = (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#363636',
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          duration: 5000,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  );

  // Patient on mobile - simplified layout without sidebar
  if (isPatientOnMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {toasterConfig}
        <MobileHeader />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  // Mobile layout for non-patients - show mobile header, hide sidebar
  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-gray-50">
        {toasterConfig}
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    );
  }

  // Desktop layout with sidebar and topbar
  return (
    <div className="flex h-screen bg-gray-50">
      {toasterConfig}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AuthProvider>
  );
}
