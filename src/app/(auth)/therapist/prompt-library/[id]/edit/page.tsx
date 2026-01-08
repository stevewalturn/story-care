'use client';

/**
 * Edit Prompt Page
 * Full-page drag-and-drop prompt builder for editing existing prompts
 */

import { useParams } from 'next/navigation';
import { PromptBlockBuilder } from '@/components/prompts/builder/PromptBlockBuilder';

export default function EditPromptPage() {
  const params = useParams();
  const promptId = params.id as string;

  return <PromptBlockBuilder mode="edit" promptId={promptId} />;
}
