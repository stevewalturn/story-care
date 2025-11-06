/**
 * Template Service
 * Business logic for template management
 */

import { eq, and, or, desc, count } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  surveyTemplatesSchema,
  reflectionTemplatesSchema,
} from '@/models/Schema';
import type {
  TemplateScope,
  TemplateStatus,
} from '@/types/Organization';

/**
 * Create survey template
 */
export async function createSurveyTemplate(data: {
  title: string;
  description?: string;
  category: string;
  questions: any[];
  scope: TemplateScope;
  createdBy: string;
  organizationId?: string | null;
  metadata?: any;
}) {
  const [template] = await db
    .insert(surveyTemplatesSchema)
    .values({
      title: data.title,
      description: data.description || null,
      category: data.category as any,
      questions: data.questions,
      scope: data.scope,
      status: 'active',
      createdBy: data.createdBy,
      organizationId: data.organizationId || null,
      metadata: data.metadata || null,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return template;
}

/**
 * Create reflection template
 */
export async function createReflectionTemplate(data: {
  title: string;
  description?: string;
  category: string;
  questions: any[];
  scope: TemplateScope;
  createdBy: string;
  organizationId?: string | null;
  metadata?: any;
}) {
  const [template] = await db
    .insert(reflectionTemplatesSchema)
    .values({
      title: data.title,
      description: data.description || null,
      category: data.category as any,
      questions: data.questions,
      scope: data.scope,
      status: 'active',
      createdBy: data.createdBy,
      organizationId: data.organizationId || null,
      metadata: data.metadata || null,
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return template;
}

/**
 * List survey templates with scope filtering
 */
export async function listSurveyTemplates(params: {
  userId: string;
  organizationId: string | null;
  scope?: TemplateScope;
  status?: TemplateStatus;
}) {
  const conditions = [];

  // Scope filtering: system + organization (if has org) + own private
  if (params.scope) {
    conditions.push(eq(surveyTemplatesSchema.scope, params.scope));
  } else {
    conditions.push(
      or(
        eq(surveyTemplatesSchema.scope, 'system'),
        params.organizationId
          ? and(
              eq(surveyTemplatesSchema.scope, 'organization'),
              eq(surveyTemplatesSchema.organizationId, params.organizationId),
            )
          : undefined,
        and(
          eq(surveyTemplatesSchema.scope, 'private'),
          eq(surveyTemplatesSchema.createdBy, params.userId),
        ),
      )!,
    );
  }

  // Status filtering
  if (params.status) {
    conditions.push(eq(surveyTemplatesSchema.status, params.status));
  } else {
    conditions.push(eq(surveyTemplatesSchema.status, 'active'));
  }

  const templates = await db
    .select()
    .from(surveyTemplatesSchema)
    .where(and(...conditions))
    .orderBy(desc(surveyTemplatesSchema.createdAt));

  return templates;
}

/**
 * List reflection templates with scope filtering
 */
export async function listReflectionTemplates(params: {
  userId: string;
  organizationId: string | null;
  scope?: TemplateScope;
  status?: TemplateStatus;
}) {
  const conditions = [];

  // Scope filtering
  if (params.scope) {
    conditions.push(eq(reflectionTemplatesSchema.scope, params.scope));
  } else {
    conditions.push(
      or(
        eq(reflectionTemplatesSchema.scope, 'system'),
        params.organizationId
          ? and(
              eq(reflectionTemplatesSchema.scope, 'organization'),
              eq(reflectionTemplatesSchema.organizationId, params.organizationId),
            )
          : undefined,
        and(
          eq(reflectionTemplatesSchema.scope, 'private'),
          eq(reflectionTemplatesSchema.createdBy, params.userId),
        ),
      )!,
    );
  }

  // Status filtering
  if (params.status) {
    conditions.push(eq(reflectionTemplatesSchema.status, params.status));
  } else {
    conditions.push(eq(reflectionTemplatesSchema.status, 'active'));
  }

  const templates = await db
    .select()
    .from(reflectionTemplatesSchema)
    .where(and(...conditions))
    .orderBy(desc(reflectionTemplatesSchema.createdAt));

  return templates;
}

/**
 * Submit template for organization approval
 */
export async function submitSurveyTemplateForApproval(
  templateId: string,
  organizationId: string,
) {
  const [updated] = await db
    .update(surveyTemplatesSchema)
    .set({
      scope: 'organization',
      status: 'pending_approval',
      organizationId,
      updatedAt: new Date(),
    })
    .where(eq(surveyTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

export async function submitReflectionTemplateForApproval(
  templateId: string,
  organizationId: string,
) {
  const [updated] = await db
    .update(reflectionTemplatesSchema)
    .set({
      scope: 'organization',
      status: 'pending_approval',
      organizationId,
      updatedAt: new Date(),
    })
    .where(eq(reflectionTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

/**
 * Approve template (Org Admin)
 */
export async function approveSurveyTemplate(
  templateId: string,
  approvedBy: string,
) {
  const [updated] = await db
    .update(surveyTemplatesSchema)
    .set({
      status: 'active',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(surveyTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

export async function approveReflectionTemplate(
  templateId: string,
  approvedBy: string,
) {
  const [updated] = await db
    .update(reflectionTemplatesSchema)
    .set({
      status: 'active',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(reflectionTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

/**
 * Reject template (Org Admin)
 */
export async function rejectSurveyTemplate(
  templateId: string,
  reason: string,
) {
  const [updated] = await db
    .update(surveyTemplatesSchema)
    .set({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(surveyTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

export async function rejectReflectionTemplate(
  templateId: string,
  reason: string,
) {
  const [updated] = await db
    .update(reflectionTemplatesSchema)
    .set({
      status: 'rejected',
      rejectionReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(reflectionTemplatesSchema.id, templateId))
    .returning();

  return updated;
}

/**
 * Get pending templates for approval (Org Admin)
 */
export async function getPendingSurveyTemplates(organizationId: string) {
  const templates = await db
    .select()
    .from(surveyTemplatesSchema)
    .where(
      and(
        eq(surveyTemplatesSchema.organizationId, organizationId),
        eq(surveyTemplatesSchema.status, 'pending_approval'),
      ),
    )
    .orderBy(desc(surveyTemplatesSchema.createdAt));

  return templates;
}

export async function getPendingReflectionTemplates(organizationId: string) {
  const templates = await db
    .select()
    .from(reflectionTemplatesSchema)
    .where(
      and(
        eq(reflectionTemplatesSchema.organizationId, organizationId),
        eq(reflectionTemplatesSchema.status, 'pending_approval'),
      ),
    )
    .orderBy(desc(reflectionTemplatesSchema.createdAt));

  return templates;
}
