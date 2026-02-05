'use client';

import { LogOut, Menu, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getNavigationForRole } from '@/config/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/libs/Firebase';

export function MobileHeader() {
  const { dbUser } = useAuth();
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Get navigation items based on user role
  const navItems = dbUser?.role ? getNavigationForRole(dbUser.role) : [];

  // Check if a nav item is active
  const isItemActive = (itemHref: string): boolean => {
    if (!pathname) return false;
    if (pathname === itemHref) return true;
    if (!pathname.startsWith(itemHref)) return false;

    const hasMoreSpecificMatch = navItems.some(
      otherItem =>
        otherItem.href !== itemHref
        && otherItem.href.startsWith(itemHref)
        && pathname.startsWith(otherItem.href),
    );

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

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await fetch('/api/auth/session', { method: 'DELETE' });
      window.location.href = '/sign-in';
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <header className="pt-safe sticky top-0 z-40 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="StoryCare" width={28} height={28} />
          <span className="text-base font-semibold text-purple-600">StoryCare</span>
        </Link>

        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="pt-safe flex h-14 items-center justify-between border-b border-gray-200 px-4">
          <span className="text-base font-semibold text-gray-800">Menu</span>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User Info */}
        {dbUser && (
          <div className="border-b border-gray-200 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                {dbUser.name?.[0]?.toUpperCase() || dbUser.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-gray-800">
                  {dbUser.name || 'User'}
                </p>
                <p className="truncate text-xs text-gray-500">{dbUser.email}</p>
              </div>
            </div>
            {dbUser.role && (
              <div className="mt-3">
                <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {getRoleDisplay(dbUser.role)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsDrawerOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {item.name}
                  {item.badge && (
                    <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="pb-safe border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
