/**
 * Module Service
 * Business logic for treatment module management
 */

import type { TemplateScope } from '@/types/Organization';
import { and, desc, eq, or, sql } from 'drizzle-orm';
import { db } from '@/libs/DB';
import {
  moduleAiPromptsSchema,
  modulePromptLinksSchema,
  reflectionTemplatesSchema,
  surveyTemplatesSchema,
  treatmentModulesSchema,
} from '@/models/Schema';

export type TherapeuticDomain
  = | 'self_strength'
    | 'relationships_repair'
    | 'identity_transformation'
    | 'purpose_future';

export type ModuleStatus = 'active' | 'archived' | 'pending_approval';

/**
 * Create treatment module
 */
export async function createModule(data: {
  name: string;
  domain: TherapeuticDomain;
  description: string;
  scope: TemplateScope;
  createdBy: string;
  organizationId?: string | null;
  reflectionQuestions?: string[];
  reflectionTemplateId?: string | null;
  surveyTemplateId?: string | null;
  aiPromptText: string;
  aiPromptMetadata?: any;
}) {
  const [module] = await db
    .insert(treatmentModulesSchema)
    .values({
      name: data.name,
      domain: data.domain,
      description: data.description,
      scope: data.scope,
      createdBy: data.createdBy,
      organizationId: data.organizationId || null,
      reflectionQuestions: data.reflectionQuestions || [],
      reflectionTemplateId: data.reflectionTemplateId || null,
      surveyTemplateId: data.surveyTemplateId || null,
      aiPromptText: data.aiPromptText,
      aiPromptMetadata: data.aiPromptMetadata || null,
      status: 'active',
      useCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return module;
}

/**
 * List modules with scope filtering
 */
export async function listModules(params: {
  userId: string;
  organizationId: string | null;
  scope?: TemplateScope;
  domain?: TherapeuticDomain;
  status?: ModuleStatus;
}) {
  const conditions = [];

  // Scope filtering: system + organization (if has org) + own private
  if (params.scope) {
    conditions.push(eq(treatmentModulesSchema.scope, params.scope));
  } else {
    conditions.push(
      or(
        eq(treatmentModulesSchema.scope, 'system'),
        params.organizationId
          ? and(
              eq(treatmentModulesSchema.scope, 'organization'),
              eq(treatmentModulesSchema.organizationId, params.organizationId),
            )
          : undefined,
        and(
          eq(treatmentModulesSchema.scope, 'private'),
          eq(treatmentModulesSchema.createdBy, params.userId),
        ),
      )!,
    );
  }

  // Domain filtering
  if (params.domain) {
    conditions.push(eq(treatmentModulesSchema.domain, params.domain));
  }

  // Status filtering
  if (params.status) {
    conditions.push(eq(treatmentModulesSchema.status, params.status));
  } else {
    conditions.push(eq(treatmentModulesSchema.status, 'active'));
  }

  const modules = await db
    .select()
    .from(treatmentModulesSchema)
    .where(and(...conditions))
    .orderBy(desc(treatmentModulesSchema.createdAt));

  return modules;
}

/**
 * Get module by ID with full details
 */
export async function getModuleById(moduleId: string) {
  const [module] = await db
    .select()
    .from(treatmentModulesSchema)
    .where(eq(treatmentModulesSchema.id, moduleId))
    .limit(1);

  if (!module) {
    throw new Error('Module not found');
  }

  // Fetch linked templates
  let reflectionTemplate = null;
  let surveyTemplate = null;

  if (module.reflectionTemplateId) {
    const [reflection] = await db
      .select()
      .from(reflectionTemplatesSchema)
      .where(eq(reflectionTemplatesSchema.id, module.reflectionTemplateId))
      .limit(1);
    reflectionTemplate = reflection || null;
  }

  if (module.surveyTemplateId) {
    const [survey] = await db
      .select()
      .from(surveyTemplatesSchema)
      .where(eq(surveyTemplatesSchema.id, module.surveyTemplateId))
      .limit(1);
    surveyTemplate = survey || null;
  }

  return {
    module,
    reflectionTemplate,
    surveyTemplate,
  };
}

/**
 * Update module
 */
export async function updateModule(
  moduleId: string,
  updates: {
    name?: string;
    description?: string;
    inSessionQuestions?: string[];
    reflectionQuestions?: string[];
    reflectionTemplateId?: string | null;
    surveyTemplateId?: string | null;
    aiPromptText?: string;
    aiPromptMetadata?: any;
    status?: ModuleStatus;
  },
) {
  const [updated] = await db
    .update(treatmentModulesSchema)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(treatmentModulesSchema.id, moduleId))
    .returning();

  return updated;
}

/**
 * Archive module (soft delete)
 */
export async function archiveModule(moduleId: string) {
  const [archived] = await db
    .update(treatmentModulesSchema)
    .set({
      status: 'archived',
      updatedAt: new Date(),
    })
    .where(eq(treatmentModulesSchema.id, moduleId))
    .returning();

  return archived;
}

/**
 * Increment module use count
 */
export async function incrementModuleUseCount(moduleId: string) {
  await db
    .update(treatmentModulesSchema)
    .set({
      useCount: sql`${treatmentModulesSchema.useCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(treatmentModulesSchema.id, moduleId));
}

/**
 * Get modules by domain
 */
export async function getModulesByDomain(
  domain: TherapeuticDomain,
  userId: string,
  organizationId: string | null,
) {
  return listModules({
    userId,
    organizationId,
    domain,
    status: 'active',
  });
}

/**
 * Get module usage statistics
 */
export async function getModuleStats(moduleId: string) {
  const [module] = await db
    .select({
      useCount: treatmentModulesSchema.useCount,
      name: treatmentModulesSchema.name,
      domain: treatmentModulesSchema.domain,
    })
    .from(treatmentModulesSchema)
    .where(eq(treatmentModulesSchema.id, moduleId))
    .limit(1);

  if (!module) {
    throw new Error('Module not found');
  }

  // TODO: Add more analytics like avg patient engagement, resonance scores
  // This will require joining with session_modules, survey_responses, etc.
  return {
    useCount: module.useCount,
    name: module.name,
    domain: module.domain,
  };
}

/**
 * Submit module for approval (organization scope)
 */
export async function submitModuleForApproval(
  moduleId: string,
  organizationId: string,
) {
  const [updated] = await db
    .update(treatmentModulesSchema)
    .set({
      scope: 'organization',
      status: 'pending_approval',
      organizationId,
      updatedAt: new Date(),
    })
    .where(eq(treatmentModulesSchema.id, moduleId))
    .returning();

  return updated;
}

/**
 * Approve module (Org Admin)
 */
export async function approveModule(moduleId: string) {
  const [updated] = await db
    .update(treatmentModulesSchema)
    .set({
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(treatmentModulesSchema.id, moduleId))
    .returning();

  return updated;
}

/**
 * Get pending modules for approval (Org Admin)
 */
export async function getPendingModules(organizationId: string) {
  const modules = await db
    .select()
    .from(treatmentModulesSchema)
    .where(
      and(
        eq(treatmentModulesSchema.organizationId, organizationId),
        eq(treatmentModulesSchema.status, 'pending_approval'),
      ),
    )
    .orderBy(desc(treatmentModulesSchema.createdAt));

  return modules;
}

// ============================================================================
// ROLE-SPECIFIC FUNCTIONS (Super Admin, Org Admin, Therapist)
// ============================================================================

/**
 * List system templates (Super Admin)
 * Returns all modules with scope='system'
 */
export async function listTemplates(params?: {
  domain?: TherapeuticDomain;
  status?: ModuleStatus;
}) {
  const conditions = [eq(treatmentModulesSchema.scope, 'system')];

  if (params?.domain) {
    conditions.push(eq(treatmentModulesSchema.domain, params.domain));
  }

  if (params?.status) {
    conditions.push(eq(treatmentModulesSchema.status, params.status));
  } else {
    conditions.push(eq(treatmentModulesSchema.status, 'active'));
  }

  const templates = await db
    .select()
    .from(treatmentModulesSchema)
    .where(and(...conditions))
    .orderBy(desc(treatmentModulesSchema.createdAt));

  // Fetch linked prompts for all templates
  const templatesWithPrompts = await Promise.all(
    templates.map(async (template) => {
      const linkedPrompts = await db
        .select({
          id: moduleAiPromptsSchema.id,
          name: moduleAiPromptsSchema.name,
          promptText: moduleAiPromptsSchema.promptText,
          description: moduleAiPromptsSchema.description,
          category: moduleAiPromptsSchema.category,
          icon: moduleAiPromptsSchema.icon,
          isActive: moduleAiPromptsSchema.isActive,
          sortOrder: modulePromptLinksSchema.sortOrder,
        })
        .from(modulePromptLinksSchema)
        .innerJoin(
          moduleAiPromptsSchema,
          eq(modulePromptLinksSchema.promptId, moduleAiPromptsSchema.id),
        )
        .where(eq(modulePromptLinksSchema.moduleId, template.id))
        .orderBy(modulePromptLinksSchema.sortOrder);

      return {
        ...template,
        linkedPrompts: linkedPrompts.filter(p => p.isActive),
      };
    }),
  );

  return templatesWithPrompts;
}

/**
 * Create system template (Super Admin)
 * Wrapper for createModule with scope='system'
 */
export async function createTemplate(data: {
  name: string;
  domain: TherapeuticDomain;
  description: string;
  createdBy: string;

  reflectionQuestions?: string[];
  reflectionTemplateId?: string | null;
  surveyTemplateId?: string | null;
  aiPromptText: string;
  aiPromptMetadata?: any;
}) {
  return createModule({
    ...data,
    scope: 'system',
    organizationId: null,
  });
}

/**
 * List organization modules (Org Admin)
 * Returns modules with scope='organization' for specific org
 */
export async function listOrgModules(
  organizationId: string,
  params?: {
    domain?: TherapeuticDomain;
    status?: ModuleStatus;
  },
) {
  const conditions = [
    eq(treatmentModulesSchema.scope, 'organization'),
    eq(treatmentModulesSchema.organizationId, organizationId),
  ];

  if (params?.domain) {
    conditions.push(eq(treatmentModulesSchema.domain, params.domain));
  }

  if (params?.status) {
    conditions.push(eq(treatmentModulesSchema.status, params.status));
  } else {
    conditions.push(eq(treatmentModulesSchema.status, 'active'));
  }

  const modules = await db
    .select()
    .from(treatmentModulesSchema)
    .where(and(...conditions))
    .orderBy(desc(treatmentModulesSchema.createdAt));

  // Fetch linked prompts for all organization modules
  const modulesWithPrompts = await Promise.all(
    modules.map(async (module) => {
      const linkedPrompts = await db
        .select({
          id: moduleAiPromptsSchema.id,
          name: moduleAiPromptsSchema.name,
          promptText: moduleAiPromptsSchema.promptText,
          description: moduleAiPromptsSchema.description,
          category: moduleAiPromptsSchema.category,
          icon: moduleAiPromptsSchema.icon,
          isActive: moduleAiPromptsSchema.isActive,
          sortOrder: modulePromptLinksSchema.sortOrder,
        })
        .from(modulePromptLinksSchema)
        .innerJoin(
          moduleAiPromptsSchema,
          eq(modulePromptLinksSchema.promptId, moduleAiPromptsSchema.id),
        )
        .where(eq(modulePromptLinksSchema.moduleId, module.id))
        .orderBy(modulePromptLinksSchema.sortOrder);

      return {
        ...module,
        linkedPrompts: linkedPrompts.filter(p => p.isActive),
      };
    }),
  );

  return modulesWithPrompts;
}

/**
 * Create organization module (Org Admin)
 * Wrapper for createModule with scope='organization'
 */
export async function createOrgModule(data: {
  name: string;
  domain: TherapeuticDomain;
  description: string;
  organizationId: string;
  createdBy: string;

  reflectionQuestions?: string[];
  reflectionTemplateId?: string | null;
  surveyTemplateId?: string | null;
  aiPromptText: string;
  aiPromptMetadata?: any;
}) {
  return createModule({
    ...data,
    scope: 'organization',
  });
}

/**
 * Copy system template to organization scope (Org Admin)
 * Creates a new module by copying a template
 */
export async function copyTemplateToOrg(
  templateId: string,
  organizationId: string,
  userId: string,
  customName?: string,
) {
  // Fetch the template
  const { module: template, reflectionTemplate: _reflectionTemplate, surveyTemplate: _surveyTemplate }
    = await getModuleById(templateId);

  // Verify it's a system template
  if (template.scope !== 'system') {
    throw new Error('Can only copy system templates');
  }

  // Create new organization module
  const newModule = await createOrgModule({
    name: customName || template.name, // Use custom name if provided
    domain: template.domain,
    description: template.description,
    organizationId,
    createdBy: userId,

    reflectionQuestions: template.reflectionQuestions as string[],
    reflectionTemplateId: template.reflectionTemplateId,
    surveyTemplateId: template.surveyTemplateId,
    aiPromptText: template.aiPromptText,
    aiPromptMetadata: template.aiPromptMetadata,
  });

  return {
    module: newModule,
    copiedFrom: templateId,
  };
}

/**
 * List therapist modules (Therapist)
 * Returns modules with scope='private' created by therapist
 */
export async function listTherapistModules(
  therapistId: string,
  params?: {
    domain?: TherapeuticDomain;
    status?: ModuleStatus;
  },
) {
  const conditions = [
    eq(treatmentModulesSchema.scope, 'private'),
    eq(treatmentModulesSchema.createdBy, therapistId),
  ];

  if (params?.domain) {
    conditions.push(eq(treatmentModulesSchema.domain, params.domain));
  }

  if (params?.status) {
    conditions.push(eq(treatmentModulesSchema.status, params.status));
  } else {
    conditions.push(eq(treatmentModulesSchema.status, 'active'));
  }

  const modules = await db
    .select()
    .from(treatmentModulesSchema)
    .where(and(...conditions))
    .orderBy(desc(treatmentModulesSchema.createdAt));

  // Fetch linked prompts for all therapist modules
  const modulesWithPrompts = await Promise.all(
    modules.map(async (module) => {
      const linkedPrompts = await db
        .select({
          id: moduleAiPromptsSchema.id,
          name: moduleAiPromptsSchema.name,
          promptText: moduleAiPromptsSchema.promptText,
          description: moduleAiPromptsSchema.description,
          category: moduleAiPromptsSchema.category,
          icon: moduleAiPromptsSchema.icon,
          isActive: moduleAiPromptsSchema.isActive,
          sortOrder: modulePromptLinksSchema.sortOrder,
        })
        .from(modulePromptLinksSchema)
        .innerJoin(
          moduleAiPromptsSchema,
          eq(modulePromptLinksSchema.promptId, moduleAiPromptsSchema.id),
        )
        .where(eq(modulePromptLinksSchema.moduleId, module.id))
        .orderBy(modulePromptLinksSchema.sortOrder);

      return {
        ...module,
        linkedPrompts: linkedPrompts.filter(p => p.isActive),
      };
    }),
  );

  return modulesWithPrompts;
}

/**
 * Create therapist module (Therapist)
 * Wrapper for createModule with scope='private'
 */
export async function createTherapistModule(data: {
  name: string;
  domain: TherapeuticDomain;
  description: string;
  createdBy: string;

  reflectionQuestions?: string[];
  reflectionTemplateId?: string | null;
  surveyTemplateId?: string | null;
  aiPromptText: string;
  aiPromptMetadata?: any;
}) {
  return createModule({
    ...data,
    scope: 'private',
    organizationId: null,
  });
}
