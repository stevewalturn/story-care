'use client';

/**
 * Super Admin - Create System Prompt Page
 * Uses the block builder for creating system-wide prompts
 */

import { PromptBlockBuilder } from '@/components/prompts/builder/PromptBlockBuilder';

export default function SuperAdminCreatePromptPage() {
  return <PromptBlockBuilder mode="create" />;
}
