'use client';

/**
 * Super Admin - Edit System Prompt Page
 * Uses the block builder for editing system-wide prompts
 */

import { useParams } from 'next/navigation';
import { PromptBlockBuilder } from '@/components/prompts/builder/PromptBlockBuilder';

export default function SuperAdminEditPromptPage() {
  const params = useParams();
  const promptId = params.id as string;

  return <PromptBlockBuilder mode="edit" promptId={promptId} scope="system" />;
}
