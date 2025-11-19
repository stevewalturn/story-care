'use client';

/**
 * Scenes Library Component
 * Displays all scenes as cards with options to edit, preview, or create new
 */

import { Film, MoreVertical, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type Scene = {
  id: string;
  title: string;
  description: string;
  patientId: string;
  patientName?: string;
  durationSeconds: string;
  status: string;
  assembledVideoUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type ScenesLibraryProps = {
  onEditScene: (sceneId: string) => void;
  onCreateNew: () => void;
};

export function ScenesLibrary({ onEditScene, onCreateNew }: ScenesLibraryProps) {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    fetchPatients();
    fetchScenes();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const fetchScenes = async () => {
    try {
      setLoading(true);
      const params = selectedPatient !== 'all' ? `?patientId=${selectedPatient}` : '';
      const response = await authenticatedFetch(`/api/scenes${params}`, user);

      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
      } else {
        toast.error('Failed to load scenes');
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
      toast.error('Error loading scenes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScenes();
  }, [selectedPatient]);

  const handleDeleteScene = async (sceneId: string) => {
    if (!confirm('Are you sure you want to delete this scene?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/scenes/${sceneId}`, user, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Scene deleted successfully');
        fetchScenes();
      } else {
        toast.error('Failed to delete scene');
      }
    } catch (error) {
      console.error('Error deleting scene:', error);
      toast.error('Error deleting scene');
    }
  };

  const filteredScenes = scenes.filter((scene) => {
    const matchesSearch = scene.title.toLowerCase().includes(searchQuery.toLowerCase())
      || scene.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600">
                <Film className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Video Scenes</h1>
                <p className="text-sm text-gray-600">
                  Create and manage video scenes for your patients
                </p>
              </div>
            </div>
            <Button variant="primary" onClick={onCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Create New Scene
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative max-w-md flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search scenes..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-9 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Patient Filter */}
          <select
            value={selectedPatient}
            onChange={e => setSelectedPatient(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="all">All Patients</option>
            {patients.map(patient => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
        </div>

        {/* Scenes Grid */}
        {filteredScenes.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <Film className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <h3 className="mb-1 text-lg font-semibold text-gray-900">No scenes found</h3>
            <p className="mb-4 text-sm text-gray-600">
              {searchQuery || selectedPatient !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first scene to get started'}
            </p>
            {!searchQuery && selectedPatient === 'all' && (
              <Button variant="primary" onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Scene
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredScenes.map(scene => (
              <SceneCard
                key={scene.id}
                scene={scene}
                onEdit={() => onEditScene(scene.id)}
                onDelete={() => handleDeleteScene(scene.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Scene Card Component
 */
type SceneCardProps = {
  scene: Scene;
  onEdit: () => void;
  onDelete: () => void;
};

function SceneCard({ scene, onEdit, onDelete }: SceneCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const statusColors = {
    draft: 'bg-gray-100 text-gray-700',
    assembled: 'bg-green-100 text-green-700',
    processing: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  };

  const formatDuration = (seconds: string) => {
    const secs = Number.parseFloat(seconds);
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group relative rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-900">
        {scene.thumbnailUrl || scene.assembledVideoUrl ? (
          <>
            <img
              src={scene.thumbnailUrl || '/placeholder-video.jpg'}
              alt={scene.title}
              className="h-full w-full object-cover"
            />
            {scene.assembledVideoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Play className="h-12 w-12 text-white" />
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <Film className="h-12 w-12 text-gray-600" />
          </div>
        )}

        {/* Duration Badge */}
        {scene.durationSeconds && Number.parseFloat(scene.durationSeconds) > 0 && (
          <div className="absolute right-2 bottom-2 rounded bg-black/75 px-2 py-0.5 text-xs font-medium text-white">
            {formatDuration(scene.durationSeconds)}
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[scene.status as keyof typeof statusColors] || statusColors.draft}`}
          >
            {scene.status}
          </span>
        </div>

        {/* Actions Menu */}
        <div className="absolute top-2 right-2">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg bg-black/50 p-1.5 text-white hover:bg-black/70"
            type="button"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
                onKeyDown={e => e.key === 'Escape' && setShowMenu(false)}
              />

              {/* Menu */}
              <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  type="button"
                >
                  <Film className="h-4 w-4" />
                  Edit Scene
                </button>

                {scene.assembledVideoUrl && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      window.open(scene.assembledVideoUrl!, '_blank');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    type="button"
                  >
                    <Play className="h-4 w-4" />
                    Watch Video
                  </button>
                )}

                <hr className="my-1" />

                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  type="button"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <button
        onClick={onEdit}
        className="w-full p-4 text-left"
        type="button"
      >
        <h3 className="mb-1 line-clamp-1 font-semibold text-gray-900">
          {scene.title}
        </h3>
        {scene.description && (
          <p className="mb-2 line-clamp-2 text-sm text-gray-600">
            {scene.description}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{scene.patientName || 'Unknown Patient'}</span>
          <span>{new Date(scene.updatedAt).toLocaleDateString()}</span>
        </div>
      </button>
    </div>
  );
}
