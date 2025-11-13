/**
 * Navigation Configuration
 * Role-based menu items for different user types
 */

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  ClipboardList,
  FileText,
  Film,
  Folder,
  Image,
  Layers,
  LayoutDashboard,
  Library,
  MessageSquare,
  Settings,
  Users,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string; // For showing counts (e.g., pending users)
  description?: string;
};

export type NavigationConfig = {
  super_admin: NavItem[];
  org_admin: NavItem[];
  therapist: NavItem[];
  patient: NavItem[];
};

/**
 * Navigation menu configuration by role
 */
export const navigationConfig: NavigationConfig = {
  /**
   * Super Admin Navigation
   * Platform-wide management and oversight
   */
  super_admin: [
    {
      name: 'Platform Dashboard',
      href: '/super-admin/dashboard',
      icon: LayoutDashboard,
      description: 'Platform-wide metrics and analytics',
    },
    {
      name: 'Module Templates',
      href: '/super-admin/module-templates',
      icon: Layers,
      description: 'Manage system-wide module templates',
    },
    {
      name: 'Organizations',
      href: '/super-admin/organizations',
      icon: Building2,
      description: 'Manage all organizations',
    },
    {
      name: 'All Users',
      href: '/super-admin/users',
      icon: Users,
      description: 'User management across organizations',
    },
    {
      name: 'Audit Logs',
      href: '/super-admin/audit',
      icon: ClipboardList,
      description: 'Security and access logs',
    },
    {
      name: 'System Settings',
      href: '/super-admin/settings',
      icon: Settings,
      description: 'Platform configuration',
    },
  ],

  /**
   * Organization Admin Navigation
   * Organization-level management
   */
  org_admin: [
    {
      name: 'Dashboard',
      href: '/org-admin/dashboard',
      icon: LayoutDashboard,
      description: 'Organization overview',
    },
    {
      name: 'Treatment Modules',
      href: '/org-admin/modules',
      icon: Layers,
      description: 'Manage organization modules',
    },
    {
      name: 'Therapists',
      href: '/org-admin/therapists',
      icon: Users,
      description: 'Manage therapist accounts',
    },
    {
      name: 'Patients',
      href: '/patients',
      icon: Users,
      description: 'View all patients',
    },
    {
      name: 'Template Library',
      href: '/org-admin/templates',
      icon: Library,
      description: 'Approve and manage templates',
    },
    {
      name: 'Organization Settings',
      href: '/org-admin/settings',
      icon: Settings,
      description: 'Org settings and defaults',
    },
  ],

  /**
   * Therapist Navigation
   * Clinical workflow and patient management
   */
  therapist: [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      description: 'Overview and recent activity',
    },
    {
      name: 'My Modules',
      href: '/therapist/modules',
      icon: Layers,
      description: 'My personal treatment modules',
    },
    {
      name: 'My Patients',
      href: '/patients',
      icon: Users,
      description: 'Manage your patients',
    },
    {
      name: 'Sessions',
      href: '/sessions',
      icon: Folder,
      description: 'Session recordings and transcripts',
    },
    {
      name: 'Assets',
      href: '/assets',
      icon: Image,
      description: 'Media library (images, videos)',
    },
    {
      name: 'Scenes',
      href: '/scenes',
      icon: Film,
      description: 'Video scene editor',
    },
    {
      name: 'Story Pages',
      href: '/pages',
      icon: FileText,
      description: 'Create patient story pages',
    },
    {
      name: 'Patient Responses',
      href: '/therapist/responses',
      icon: MessageSquare,
      description: 'View patient reflections and survey responses',
    },
  ],

  /**
   * Patient Navigation
   * Patient-facing interface
   */
  patient: [
    {
      name: 'Stories for You',
      href: '/patient/story',
      icon: BookOpen,
      description: 'Your personalized story pages',
    },
  ],
};

/**
 * Get navigation items for a specific role
 */
export function getNavigationForRole(
  role: 'super_admin' | 'org_admin' | 'therapist' | 'patient',
): NavItem[] {
  return navigationConfig[role] || [];
}

/**
 * Check if a user has access to a specific route
 */
export function canAccessRoute(
  role: 'super_admin' | 'org_admin' | 'therapist' | 'patient',
  path: string,
): boolean {
  const navItems = getNavigationForRole(role);
  return navItems.some(item => path.startsWith(item.href));
}
