'use client';

import { useState } from 'react';
import { PromptLibrary } from '@/components/prompts/PromptLibrary';
import { PromptModal } from '@/components/prompts/PromptModal';

type Prompt = {
  id: string;
  title: string;
  description: string;
  promptText: string;
  category: string;
  tags: string[];
  useCount: number;
  createdAt: Date;
  isFavorite?: boolean;
};

export default function PromptsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | undefined>();

  const handleAddClick = () => {
    setEditingPrompt(undefined);
    setShowModal(true);
  };

  const handleEditClick = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setShowModal(true);
  };

  const handleSave = async (promptData: Partial<Prompt>) => {
    if (editingPrompt) {
      // Update existing prompt
      console.error('Updating prompt:', editingPrompt.id, promptData);
      // In real implementation: await fetch(`/api/prompts/${editingPrompt.id}`, { method: 'PUT', body: JSON.stringify(promptData) });
    } else {
      // Create new prompt
      console.error('Creating prompt:', promptData);
      // In real implementation: await fetch('/api/prompts', { method: 'POST', body: JSON.stringify(promptData) });
    }
  };

  const handleDelete = async (promptId: string) => {
    console.error('Deleting prompt:', promptId);
    // In real implementation: await fetch(`/api/prompts/${promptId}`, { method: 'DELETE' });
  };

  const handleSelectPrompt = (prompt: Prompt) => {
    // Copy to clipboard and show notification
    navigator.clipboard.writeText(prompt.promptText);
    console.error('Selected prompt:', prompt.id);
    // In real implementation, could also open the generate image modal with this prompt pre-filled
  };

  return (
    <div className="p-8">
      <PromptLibrary
        onSelectPrompt={handleSelectPrompt}
        onAddClick={handleAddClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDelete}
      />

      <PromptModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        prompt={editingPrompt}
      />
    </div>
  );
}
