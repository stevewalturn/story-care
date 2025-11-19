'use client';

import { useState } from 'react';
import { ScenesClient } from './ScenesClient';
import { ScenesLibrary } from './ScenesLibrary';

export default function ScenesPage() {
  const [view, setView] = useState<'library' | 'editor'>('library');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  const handleEditScene = (sceneId: string) => {
    setEditingSceneId(sceneId);
    setView('editor');
  };

  const handleCreateNew = () => {
    setEditingSceneId(null);
    setView('editor');
  };

  const handleBackToLibrary = () => {
    setView('library');
    setEditingSceneId(null);
  };

  if (view === 'library') {
    return (
      <ScenesLibrary
        onEditScene={handleEditScene}
        onCreateNew={handleCreateNew}
      />
    );
  }

  return (
    <ScenesClient
      initialSceneId={editingSceneId}
      onBackToLibrary={handleBackToLibrary}
    />
  );
}
