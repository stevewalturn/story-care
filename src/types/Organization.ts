// Organization Multi-Tenancy Types

import type { Organization, User } from '@/models/Schema';

// ============================================================================
// AUTHENTICATED USER (Enhanced for Organizations)
// ============================================================================

export type AuthenticatedUser = {
  uid: string; // Firebase UID
  dbUserId: string; // Database UUID
  organizationId: string | null; // null for super_admin
  email: string | null;
  emailVerified: boolean;
  role: 'super_admin' | 'org_admin' | 'therapist' | 'patient';
  status: 'invited' | 'active' | 'inactive';
};

// ============================================================================
// ORGANIZATION TYPES
// ============================================================================

export type OrganizationWithMetrics = Organization & {
  metrics: {
    therapistCount: number;
    activeTherapistCount: number;
    patientCount: number;
    activePatientCount: number;
    totalSessions: number;
    sessionsLast30Days: number;
    storageUsedGB: number;
    aiCreditsUsedThisMonth: number;
  };
};

export type OrganizationSettings = {
  subscriptionTier: 'free' | 'basic' | 'professional' | 'enterprise';
  features: {
    maxTherapists: number | null; // null = unlimited
    maxPatients: number | null;
    aiCreditsPerMonth: number;
    storageGB: number;
  };
  defaults: {
    reflectionQuestions: string[]; // Template IDs
    surveyTemplate: string | null; // Template ID
    sessionTranscriptionEnabled: boolean;
  };
  branding: {
    welcomeMessage: string | null;
    supportEmail: string | null;
  };
};

// ============================================================================
// USER TYPES (Enhanced for Organizations)
// ============================================================================

export type UserWithOrganization = User & {
  organization: Organization | null;
};

export type UserRoleChangeRequest = {
  userId: string;
  newRole: 'org_admin' | 'therapist' | 'patient';
  reason: string;
};

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export type TemplateScope = 'system' | 'organization' | 'private';
export type TemplateStatus = 'active' | 'pending_approval' | 'rejected' | 'archived';

export type TemplateWithCreator = {
  id: string;
  scope: TemplateScope;
  status: TemplateStatus;
  title: string;
  creator: {
    id: string;
    name: string;
    role: string;
  };
  approver?: {
    id: string;
    name: string;
  };
  useCount: number;
  createdAt: Date;
  approvedAt?: Date;
};

export type TemplateApprovalRequest = {
  templateId: string;
  decision: 'approve' | 'reject';
  rejectionReason?: string; // Required if decision is reject
};

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ApiError = {
  error: string;
  message?: string;
  statusCode: number;
};

// ============================================================================
// ORGANIZATION CODE TYPES
// ============================================================================

export type OrganizationCodeVerification = {
  valid: boolean;
  organization?: {
    id: string;
    name: string;
    logoUrl: string | null;
  };
  message?: string;
};

// ============================================================================
// DASHBOARD METRICS TYPES
// ============================================================================

export type PlatformMetrics = {
  totalOrganizations: number;
  activeOrganizations: number;
  totalTherapists: number;
  totalPatients: number;
  aiCreditsUsedThisMonth: number;
};

export type OrganizationMetrics = {
  activeTherapists: number;
  activePatients: number;
  sessionsLast30Days: number;
  pendingUsers: number;
  pendingTemplateApprovals: number;
};
