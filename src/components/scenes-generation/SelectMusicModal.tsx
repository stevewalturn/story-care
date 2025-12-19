'use client';

import { useEffect, useState } from 'react';
import { Library, Music, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  durationSeconds: number | null;
  tags: string[] | null;
  generationPrompt: string | null;
  sourceType: string;
  createdAt: string;
  patientId: string;
  patientName: string;
  sessionTitle: string;
};

type FilterType = 'patient' | 'session' | 'all';

type SelectMusicModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (music: MediaItem) => void;
  patientId: string;
  sessionId: string | null;
  user: any;
};

export function SelectMusicModal({
  isOpen,
  onClose,
  onSelect,
  patientId,
  sessionId,
  user,
}: SelectMusicModalProps) {
  const [filterType, setFilterType] = useState<FilterType>('patient');
  const [searchQuery, setSearchQuery] = useState('');
  const [musicList, setMusicList] = useState<MediaItem[]>([]);
  const [filteredMusicList, setFilteredMusicList] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch music based on filter type
  useEffect(() => {
    if (isOpen && user) {
      fetchMusic();
    }
  }, [isOpen, filterType, user, patientId, sessionId]);

  // Apply search filter
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredMusicList(
        musicList.filter(
          item =>
            item.title.toLowerCase().includes(query) ||
            item.tags?.some(tag => tag.toLowerCase().includes(query)),
        ),
      );
    } else {
      setFilteredMusicList(musicList);
    }
  }, [searchQuery, musicList]);

  const fetchMusic = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ type: 'audio' });

      // Apply filter
      if (filterType === 'patient') {
        params.append('patientId', patientId);
      } else if (filterType === 'session' && sessionId) {
        params.append('sessionId', sessionId);
      }
      // 'all' = no patientId/sessionId filter

      const response = await authenticatedFetch(`/api/media?${params.toString()}`, user);

      if (!response.ok) {
        throw new Error('Failed to fetch music');
      }

      const data = await response.json();
      setMusicList(data.media || []);
      setFilteredMusicList(data.media || []);
    } catch (err) {
      console.error('Error fetching music:', err);
      setError(err instanceof Error ? err.message : 'Failed to load music');
      setMusicList([]);
      setFilteredMusicList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (music: MediaItem) => {
    onSelect(music);
    toast.success(`Selected: ${music.title}`);
    onClose();
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title="Choose Music from Library"
      footer={(
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      )}
    >
      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setFilterType('patient')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'patient'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Patient's Music
        </button>
        {sessionId && (
          <button
            onClick={() => setFilterType('session')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'session'
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Session's Music
          </button>
        )}
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'border-b-2 border-indigo-500 text-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Music
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title or tags..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-20"
          />
        </div>
      </div>

      {/* Music Grid */}
      <div className="max-h-[500px] overflow-y-auto">
        {isLoading ? (
          // Loading State
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse rounded-lg border border-gray-200 p-4">
                <div className="mb-3 h-24 rounded bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200" />
                <div className="h-3 w-1/2 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ) : error ? (
          // Error State
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button variant="secondary" onClick={fetchMusic} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : filteredMusicList.length === 0 ? (
          // Empty State
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
            <Library className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p className="mb-1 text-sm font-medium text-gray-900">No music found</p>
            <p className="text-xs text-gray-500">
              {searchQuery ? 'Try a different search query' : 'Generate music to get started'}
            </p>
          </div>
        ) : (
          // Music Cards Grid
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMusicList.map(music => (
              <div
                key={music.id}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md"
              >
                {/* Icon + Duration */}
                <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                    <Music className="h-6 w-6" />
                  </div>
                  {music.durationSeconds && (
                    <div className="absolute bottom-2 right-2 rounded bg-black bg-opacity-75 px-2 py-1 text-xs font-medium text-white">
                      {formatDuration(music.durationSeconds)}
                    </div>
                  )}
                </div>

                {/* Audio Player */}
                <div className="border-b border-gray-100 p-2">
                  <audio src={music.mediaUrl} controls className="w-full" style={{ height: '32px' }}>
                    Your browser does not support the audio tag.
                  </audio>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="mb-1 line-clamp-1 text-sm font-semibold text-gray-900">
                    {music.title}
                  </h3>
                  <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <span>Audio</span>
                    <span>•</span>
                    <span>{formatDate(music.createdAt)}</span>
                  </div>

                  {/* Tags */}
                  {music.tags && music.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {music.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                        >
                          {tag}
                        </span>
                      ))}
                      {music.tags.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                          +{music.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Select Button */}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleSelect(music)}
                    className="w-full"
                  >
                    Use This Music
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
