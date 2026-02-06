'use client';

import { ArrowLeft, ArrowRight, ChevronRight, Eye, LogOut, Share } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/libs/Firebase';

type TopBarProps = {
  title?: string;
  showShare?: boolean;
  showPreview?: boolean;
  showPublish?: boolean;
  onShare?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
};

// Generate breadcrumb from pathname
function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean);
  const breadcrumbs: { label: string; href: string }[] = [];

  let currentPath = '';
  for (const segment of segments) {
    currentPath += `/${segment}`;

    // Skip dynamic segments like UUIDs
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      continue;
    }

    // Format label
    let label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());

    // Custom labels for known routes
    const labelMap: Record<string, string> = {
      'sessions': 'Sessions',
      'new': 'New Session',
      'dashboard': 'Dashboard',
      'patients': 'Patients',
      'assets': 'Content Library',
      'scenes': 'Scenes',
      'pages': 'Story Pages',
      'transcript': 'Transcript',
      'speakers': 'Speakers',
      'admin': 'Admin',
      'therapist': 'Therapist',
      'org-admin': 'Org Admin',
      'super-admin': 'Super Admin',
    };

    if (labelMap[segment]) {
      label = labelMap[segment];
    }

    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}

export function TopBar({
  title: _title,
  showShare = false,
  showPreview = false,
  showPublish = false,
  onShare,
  onPreview,
  onPublish,
}: TopBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, dbUser } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const breadcrumbs = getBreadcrumbs(pathname || '');

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      router.push('/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Left side - Navigation arrows and Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Back/Forward Navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.forward()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Go forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-medium text-gray-900">{crumb.label}</span>
              ) : (
                <button
                  onClick={() => router.push(crumb.href)}
                  className="text-gray-500 transition-colors hover:text-gray-700"
                >
                  {crumb.label}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Right side - Actions and User */}
      <div className="flex items-center gap-3">
        {showShare && (
          <Button variant="secondary" size="md" onClick={onShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
        {showPreview && (
          <Button variant="secondary" size="md" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
        )}
        {showPublish && (
          <Button variant="primary" size="md" onClick={onPublish}>
            Publish
          </Button>
        )}

        {/* User Avatar with Dropdown */}
        {user && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 rounded-full p-1 transition-colors hover:bg-gray-100"
              title="User menu"
            >
              {dbUser?.avatarUrl ? (
                <img
                  src={dbUser.avatarUrl}
                  alt="User avatar"
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
                  {dbUser?.name?.charAt(0) || user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
            </button>

            {/* User Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                {/* User Info */}
                <div className="flex items-center gap-3 px-4 py-3">
                  {dbUser?.avatarUrl ? (
                    <img
                      src={dbUser.avatarUrl}
                      alt="User avatar"
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-sm font-medium text-purple-700">
                      {dbUser?.name?.charAt(0) || user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {dbUser?.name || user.displayName || user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {user.email || ''}
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1 border-t border-gray-100" />

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
