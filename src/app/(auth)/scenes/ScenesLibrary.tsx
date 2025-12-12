'use client';

/**
 * Scenes Library Component
 * Displays all scenes as cards with options to edit, preview, or create new
 */

import { Film, Loader2, MoreVertical, Play, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { MediaViewer } from '@/components/assets/MediaViewer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type JobData = {
  id: string;
  status: string;
  progress: number;
  currentStep: string;
  cloudRunJobId: string | null;
};

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
  job?: JobData | null;
};

type ScenesLibraryProps = {
  onEditScene: (sceneId: string) => void;
  onCreateNew: () => void;
};

export function ScenesLibrary({ onEditScene, onCreateNew }: ScenesLibraryProps) {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('all');
  const [patients, setPatients] = useState<any[]>([]);
  const [completedSceneIds, setCompletedSceneIds] = useState<Set<string>>(new Set());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchPatients();
    fetchScenes();

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
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

  const fetchScenes = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      const params = selectedPatient !== 'all' ? `?patientId=${selectedPatient}` : '';
      const response = await authenticatedFetch(`/api/scenes${params}`, user);

      if (response.ok) {
        const data = await response.json();
        const newScenes: Scene[] = data.scenes || [];

        // Check for newly completed scenes
        newScenes.forEach((scene) => {
          const oldScene = scenes.find(s => s.id === scene.id);
          if (
            oldScene?.status === 'processing'
            && scene.status === 'completed'
            && !completedSceneIds.has(scene.id)
          ) {
            // Scene just completed!
            setCompletedSceneIds(prev => new Set(prev).add(scene.id));
            toast.success(`✅ ${scene.title} assembly completed!`);

            // Remove from completed set after 3 seconds
            setTimeout(() => {
              setCompletedSceneIds(prev => {
                const updated = new Set(prev);
                updated.delete(scene.id);
                return updated;
              });
            }, 3000);
          }
        });

        setScenes(newScenes);

        // Setup or clear polling based on processing scenes
        const hasProcessingScenes = newScenes.some(s => s.status === 'processing');

        if (hasProcessingScenes && !pollingIntervalRef.current) {
          // Start polling
          pollingIntervalRef.current = setInterval(() => {
            fetchScenes(true);
          }, 5000); // Poll every 5 seconds
        } else if (!hasProcessingScenes && pollingIntervalRef.current) {
          // Stop polling
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        if (!isPolling) {
          toast.error('Failed to load scenes');
        }
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
      if (!isPolling) {
        toast.error('Error loading scenes');
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchScenes();
    setRefreshing(false);
    toast.success('Scenes refreshed');
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
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
              <Button variant="primary" onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Scene
              </Button>
            </div>
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
  const [isViewerOpen, setIsViewerOpen] = useState(false);

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

  const isProcessing = scene.status === 'processing';
  const isCompleted = scene.status === 'completed';
  const progress = scene.job?.progress || 0;
  const currentStep = scene.job?.currentStep;

  return (
    <div className={`group relative rounded-lg border bg-white shadow-sm transition-all hover:shadow-md ${isCompleted ? 'animate-pulse-green' : isProcessing ? 'border-yellow-300' : 'border-gray-200'}`}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-gray-900">
        {scene.thumbnailUrl || scene.assembledVideoUrl ? (
          <>
            <img
              src={scene.thumbnailUrl || '/placeholder-video.jpg'}
              alt={scene.title}
              className="h-full w-full object-cover"
            />
            {scene.assembledVideoUrl && !isProcessing && (
              <button
                onClick={() => setIsViewerOpen(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                type="button"
                aria-label="Play video"
              >
                <Play className="h-12 w-12 text-white" />
              </button>
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
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[scene.status as keyof typeof statusColors] || statusColors.draft}`}
          >
            {scene.status}
          </span>
          {isProcessing && (
            <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
          )}
        </div>

        {/* Progress Bar for Processing Scenes */}
        {isProcessing && (
          <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2">
            <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {currentStep && (
              <p className="text-[10px] text-white">
                {currentStep} {progress > 0 && `• ${Math.round(progress)}%`}
              </p>
            )}
          </div>
        )}

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
                    if (!isProcessing) onEdit();
                  }}
                  disabled={isProcessing}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm ${isProcessing ? 'cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-100'}`}
                  type="button"
                >
                  <Film className="h-4 w-4" />
                  Edit Scene {isProcessing && '(Processing)'}
                </button>

                {scene.assembledVideoUrl && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setIsViewerOpen(true);
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

      {/* MediaViewer Modal */}
      {isViewerOpen && scene.assembledVideoUrl && (
        <MediaViewer
          item={{
            id: scene.id,
            type: 'video',
            title: scene.title,
            url: scene.assembledVideoUrl,
            createdAt: new Date(scene.createdAt),
            thumbnailUrl: scene.thumbnailUrl || undefined,
            patientName: scene.patientName,
            duration: scene.durationSeconds ? Number.parseFloat(scene.durationSeconds) : undefined,
          }}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
}
