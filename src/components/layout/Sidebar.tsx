'use client';

import { LogOut, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TherapistProfileModal } from '@/components/therapists/TherapistProfileModal';
import { getNavigationForRole } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/libs/Firebase';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

export function Sidebar() {
  const { user, dbUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Fetch therapist profile with avatar URL
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user || !dbUser || dbUser.role !== 'therapist') return;

      try {
        const response = await authenticatedFetch('/api/therapists/me', user);
        if (response.ok) {
          const data = await response.json();
          setAvatarUrl(data.therapist.avatarUrl);
        }
      } catch (error) {
        console.error('Error fetching avatar:', error);
      }
    };

    fetchAvatar();
  }, [user, dbUser]);

  const handleLogout = async () => {
    await logOut();
    router.push('/sign-in');
  };

  const handleProfileUpdate = (updatedTherapist: any) => {
    // Update avatar URL in local state
    setAvatarUrl(updatedTherapist.avatarUrl);
    setImageError(false);
  };

  // Get navigation items based on user role
  const navItems = dbUser?.role ? getNavigationForRole(dbUser.role) : [];

  // Get role display name
  const getRoleDisplay = (role: string) => {
    const roleMap = {
      super_admin: 'Super Admin',
      org_admin: 'Organization Admin',
      therapist: 'Therapist',
      patient: 'Patient',
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
          <span className="text-lg font-bold text-white">S</span>
        </div>
        <span className="ml-3 text-lg font-semibold text-gray-900">StoryCare</span>
      </div>

      {/* Role Badge */}
      {dbUser?.role && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
            {getRoleDisplay(dbUser.role)}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={item.description}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
              {item.badge && (
                <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 p-4">
        <button
          type="button"
          onClick={() => dbUser?.role === 'therapist' && setIsProfileModalOpen(true)}
          className={`mb-3 flex w-full items-center rounded-lg p-2 transition-colors ${
            dbUser?.role === 'therapist' ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'
          }`}
          title={dbUser?.role === 'therapist' ? 'Click to edit profile' : undefined}
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200">
            {avatarUrl && !imageError
              ? (
                  <img
                    src={avatarUrl}
                    alt={user?.displayName || 'User avatar'}
                    className="h-full w-full object-cover"
                    onError={() => setImageError(true)}
                  />
                )
              : (
                  <UserIcon className="h-5 w-5 text-gray-600" />
                )}
          </div>
          <div className="ml-3 min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user?.email || ''}
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </button>
      </div>

      {/* Therapist Profile Modal */}
      {dbUser?.role === 'therapist' && (
        <TherapistProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdate={handleProfileUpdate}
        />
      )}
    </aside>
  );
}
