/**
 * Navigation Configuration
 * Role-based menu items for different user types
 */

import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Building2,
  ClipboardList,
  Cpu,
  FileCheck,
  FileText,
  Film,
  Folder,
  Image,
  Layers,
  LayoutDashboard,
  Library,
  MessageSquare,
  Mic,
  Settings,
  Sparkles,
  UserCheck,
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
      name: 'Templates Library',
      href: '/super-admin/templates',
      icon: FileText,
      description: 'Manage system reflection and survey templates',
    },
    {
      name: 'Prompt Library',
      href: '/super-admin/prompts',
      icon: Sparkles,
      description: 'Manage system-wide AI prompts',
    },
    {
      name: 'AI Models',
      href: '/super-admin/ai-models',
      icon: Cpu,
      description: 'Manage AI model availability and pricing',
    },
    {
      name: 'Form Registry',
      href: '/super-admin/form-registry',
      icon: FileCheck,
      description: 'Manage clinical assessment instruments',
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
      name: 'Pending Invitations',
      href: '/super-admin/pending-invitations',
      icon: UserCheck,
      description: 'Review and approve user invitation requests',
    },
    {
      name: 'Audit Logs',
      href: '/super-admin/audit',
      icon: ClipboardList,
      description: 'Security and access logs',
    },
    {
      name: 'Platform Settings',
      href: '/super-admin/settings',
      icon: Settings,
      description: 'Platform-wide configuration and feature flags',
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
      name: 'Templates Library',
      href: '/org-admin/templates',
      icon: FileText,
      description: 'Manage organization reflection and survey templates',
    },
    {
      name: 'Prompt Library',
      href: '/org-admin/prompts',
      icon: Sparkles,
      description: 'Manage organization AI prompts',
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
      name: 'Recordings',
      href: '/sessions/recordings',
      icon: Mic,
      description: 'Manage voice recordings and shareable links',
    },
    {
      name: 'Content Library',
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
    {
      name: 'Templates Library',
      href: '/therapist/templates',
      icon: Library,
      description: 'Browse and manage reflection and survey templates',
    },
    {
      name: 'Prompt Library',
      href: '/therapist/prompt-library',
      icon: Sparkles,
      description: 'Browse and manage AI analysis prompts',
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
