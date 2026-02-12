'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getNavigationForRole } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingInvitationCount } from '@/hooks/usePendingInvitationCount';

export function Sidebar() {
  const { dbUser } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get navigation items based on user role
  const navItems = dbUser?.role ? getNavigationForRole(dbUser.role) : [];
  const { count: pendingCount } = usePendingInvitationCount();

  // Check if a nav item is active - prefer exact match or longest matching path
  const isItemActive = (itemHref: string): boolean => {
    if (!pathname) return false;

    // Exact match is always active
    if (pathname === itemHref) return true;

    // Check if current path starts with this href
    if (!pathname.startsWith(itemHref)) return false;

    // If it starts with this href, check if there's a more specific nav item that matches
    // (i.e., a longer href that also matches the current path)
    const hasMoreSpecificMatch = navItems.some(
      otherItem =>
        otherItem.href !== itemHref
        && otherItem.href.startsWith(itemHref)
        && pathname.startsWith(otherItem.href),
    );

    // Only mark as active if there's no more specific match
    return !hasMoreSpecificMatch;
  };

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
    <aside
      className={`relative flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300 ${
        isCollapsed ? 'w-[76px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className={`flex h-16 items-center border-b border-gray-200 ${isCollapsed ? 'justify-center px-[18px]' : 'px-6'}`}>
        <Image src="/logo.png" alt="StoryCare" width={32} height={32} className="flex-shrink-0" />
        {!isCollapsed && <span className="ml-3 text-lg font-semibold text-purple-600">StoryCare</span>}
      </div>

      {/* Collapse toggle button */}
      <button
        type="button"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-20 -right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-500 shadow-sm transition-colors hover:bg-gray-50"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Role Badge - hidden when collapsed */}
      {dbUser?.role && !isCollapsed && (
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="inline-flex items-center rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
            {getRoleDisplay(dbUser.role)}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 space-y-1 py-4 ${isCollapsed ? 'px-3' : 'px-3'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item.href);
          const badgeCount = item.href === '/super-admin/pending-invitations' ? pendingCount : null;
          const badgeText = item.badge || (badgeCount && badgeCount > 0 ? String(badgeCount) : null);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center text-sm font-medium transition-colors ${
                isCollapsed
                  ? `justify-center rounded-lg p-3.5 ${isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`
                  : `px-4 py-3 ${isActive ? 'border-l-4 border-purple-600 bg-purple-50 text-purple-600' : 'rounded-lg text-gray-600 hover:bg-gray-50'}`
              }`}
              title={isCollapsed ? item.name : item.description}
            >
              <div className="relative flex-shrink-0">
                <Icon className={`h-5 w-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {isCollapsed && badgeText && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {badgeText}
                  </span>
                )}
              </div>
              {!isCollapsed && (
                <>
                  {item.name}
                  {badgeText && (
                    <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      {badgeText}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
