'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getNavigationForRole } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { logOut } from '@/libs/Firebase';

export function Sidebar() {
  const { user, dbUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/sign-in');
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
        <div className="mb-3 flex items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <span className="text-sm font-medium text-gray-600">
              {user?.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.displayName || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="truncate text-xs text-gray-500">
              {user?.email || ''}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
