'use client';

import { useState } from 'react';
import { SceneGenerationLayout } from '@/components/scenes-generation/SceneGenerationLayout';
import { ScenesLibrary } from './ScenesLibrary';

export default function ScenesPage() {
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);

  const handleEditScene = (sceneId: string) => {
    setEditingSceneId(sceneId);
    setModalMode('edit');
    setShowGenerationModal(true);
  };

  const handleCreateNew = () => {
    setEditingSceneId(null);
    setModalMode('create');
    setShowGenerationModal(true);
  };

  const handleCloseModal = () => {
    setShowGenerationModal(false);
    setEditingSceneId(null);
    setLibraryRefreshKey(prev => prev + 1); // Trigger library refresh
  };

  return (
    <>
      <ScenesLibrary
        key={libraryRefreshKey}
        onEditScene={handleEditScene}
        onCreateNew={handleCreateNew}
      />

      {showGenerationModal && (
        <SceneGenerationLayout
          isOpen={showGenerationModal}
          onClose={handleCloseModal}
          mode={modalMode}
          existingSceneId={editingSceneId || undefined}
          // No patient prop - modal will show patient selector
        />
      )}
    </>
  );
}
