'use client';

import { Clapperboard, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type SceneAsset = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
};

type BrowseSceneModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (scene: SceneAsset) => void;
  patientId?: string;
};

export function BrowseSceneModal({
  isOpen,
  onClose,
  onSelect,
  patientId,
}: BrowseSceneModalProps) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [scenes, setScenes] = useState<SceneAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchScenes();
    }
  }, [isOpen, patientId]);

  const fetchScenes = async () => {
    setLoading(true);
    try {
      const url = `/api/scenes${patientId ? `?patientId=${patientId}` : ''}`;
      console.log('[BrowseSceneModal] Fetching scenes from:', url);
      const res = await authenticatedFetch(url, user);
      if (res.ok) {
        const data = await res.json();
        console.log('[BrowseSceneModal] Scenes data received:', data);
        setScenes(data.scenes || []);
      } else {
        console.error('[BrowseSceneModal] Scenes fetch failed:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Failed to fetch scenes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (scene: SceneAsset) => {
    onSelect(scene);
    onClose();
  };

  const filteredScenes = scenes.filter((scene) => {
    if (!search) return true;
    return scene.title.toLowerCase().includes(search.toLowerCase())
      || scene.description?.toLowerCase().includes(search.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Browse Scenes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search scenes..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredScenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => handleSelect(scene)}
                  className="group overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-500 hover:shadow-lg"
                >
                  <div className="relative aspect-video overflow-hidden bg-gray-100">
                    {scene.thumbnailUrl ? (
                      <img src={scene.thumbnailUrl} alt={scene.title} className="h-full w-full object-cover" />
                    ) : scene.videoUrl ? (
                      <div className="flex h-full items-center justify-center bg-gray-900">
                        <Clapperboard className="h-12 w-12 text-white opacity-50" />
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Clapperboard className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                    {scene.duration && (
                      <div className="absolute right-2 bottom-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                        {Math.floor(scene.duration / 60)}
                        :
                        {(scene.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-medium text-gray-900">{scene.title}</p>
                    {scene.description && (
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{scene.description}</p>
                    )}
                  </div>
                </button>
              ))}
              {filteredScenes.length === 0 && (
                <div className="col-span-2 py-12 text-center text-sm text-gray-500">
                  {search ? 'No scenes match your search' : 'No scenes available'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-200 p-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
