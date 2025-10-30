'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logOut } from '@/libs/Firebase';
import {
  LayoutDashboard,
  Folder,
  Users,
  Image,
  Film,
  FileText,
  Shield,
  LogOut,
  BookOpen,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Groups', href: '/groups', icon: Users },
  { name: 'Sessions', href: '/sessions', icon: Folder },
  { name: 'Assets', href: '/assets', icon: Image },
  { name: 'Prompts', href: '/prompts', icon: BookOpen },
  { name: 'Scenes', href: '/scenes', icon: Film },
  { name: 'Pages', href: '/pages', icon: FileText },
  { name: 'Admin', href: '/admin', icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push('/sign-in');
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span className="text-white font-bold text-lg">S</span>
        </div>
        <span className="ml-3 font-semibold text-lg text-gray-900">StoryCare</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">NH</span>
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Noah Hendler</p>
            <p className="text-xs text-gray-500 truncate">noahhendler@gmail.com</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </button>
      </div>
    </aside>
  );
}
