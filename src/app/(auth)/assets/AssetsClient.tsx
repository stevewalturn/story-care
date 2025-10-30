'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Image, Video, Music, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { MediaGrid } from '@/components/assets/MediaGrid';
import { MediaViewer } from '@/components/assets/MediaViewer';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateVideoModal } from '@/components/media/GenerateVideoModal';
import { useAuth } from '@/contexts/AuthContext';

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'audio' | 'quote';
  title: string;
  url: string;
  thumbnailUrl?: string;
  patientName?: string;
  sessionName?: string;
  createdAt: Date;
  duration?: number;
  text?: string;
  tags?: string[];
  prompt?: string;
}

interface Patient {
  id: string;
  name: string;
  avatarUrl?: string;
}

export function AssetsClient() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showGenerateVideoModal, setShowGenerateVideoModal] = useState(false);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch media from API
  useEffect(() => {
    fetchMedia();
    fetchPatients();
  }, [filterType]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.append('type', filterType);
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await fetch(`/api/media?${params}`);
      if (!response.ok) throw new Error('Failed to fetch media');

      const data = await response.json();

      // Transform API data to MediaItem format
      const transformedMedia: MediaItem[] = data.media.map((item: any) => ({
        id: item.id,
        type: item.mediaType,
        title: item.title,
        url: item.mediaUrl,
        thumbnailUrl: item.thumbnailUrl,
        patientName: item.patientName,
        sessionName: item.sessionTitle,
        createdAt: new Date(item.createdAt),
        duration: item.durationSeconds,
        tags: item.tags || [],
        prompt: item.generationPrompt,
      }));

      setMedia(transformedMedia);
      setError('');
    } catch (err) {
      console.error('Failed to fetch media:', err);
      setError('Failed to load media. Please try again.');
      setMedia([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients');
      if (!response.ok) throw new Error('Failed to fetch patients');

      const data = await response.json();
      setPatients(data.patients || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    }
  };

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        fetchMedia();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleDelete = async (itemId: string) => {
    try {
      const response = await fetch(`/api/media/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete media');

      // Refresh media list
      fetchMedia();
    } catch (err) {
      console.error('Failed to delete media:', err);
      alert('Failed to delete media. Please try again.');
    }
  };

  const handleGenerateImage = async (imageUrl: string, prompt: string, patientId?: string) => {
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId || patients[0]?.id,
          createdByTherapistId: user?.uid,
          title: prompt.slice(0, 100),
          mediaType: 'image',
          mediaUrl: imageUrl,
          thumbnailUrl: imageUrl,
          sourceType: 'generated',
          generationPrompt: prompt,
          aiModel: 'dall-e-3',
          tags: ['ai-generated'],
        }),
      });

      if (!response.ok) throw new Error('Failed to save generated image');

      // Refresh media list
      fetchMedia();
      setShowGenerateModal(false);
    } catch (err) {
      console.error('Failed to save generated image:', err);
      alert('Failed to save generated image. Please try again.');
    }
  };

  const handleGenerateVideo = async (videoUrl: string, prompt: string, patientId?: string) => {
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId || patients[0]?.id,
          createdByTherapistId: user?.uid,
          title: prompt.slice(0, 100),
          mediaType: 'video',
          mediaUrl: videoUrl,
          thumbnailUrl: videoUrl,
          sourceType: 'generated',
          generationPrompt: prompt,
          aiModel: 'runway-gen3',
          tags: ['ai-generated'],
        }),
      });

      if (!response.ok) throw new Error('Failed to save generated video');

      // Refresh media list
      fetchMedia();
      setShowGenerateVideoModal(false);
    } catch (err) {
      console.error('Failed to save generated video:', err);
      alert('Failed to save generated video. Please try again.');
    }
  };

  // Count by type
  const counts = {
    all: media.length,
    image: media.filter((m) => m.type === 'image').length,
    video: media.filter((m) => m.type === 'video').length,
    audio: media.filter((m) => m.type === 'audio').length,
    quote: media.filter((m) => m.type === 'quote').length,
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Patient Content Library
        </h1>
        <p className="text-sm text-gray-600">
          Manage all your generated and uploaded media assets
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <button
          onClick={() => setFilterType('all')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterType === 'all'
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <p className="text-2xl font-bold text-gray-900">{counts.all}</p>
          <p className="text-sm text-gray-600">All Items</p>
        </button>
        <button
          onClick={() => setFilterType('image')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterType === 'image'
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Image className="w-6 h-6 text-blue-600 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{counts.image}</p>
          <p className="text-sm text-gray-600">Images</p>
        </button>
        <button
          onClick={() => setFilterType('video')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterType === 'video'
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Video className="w-6 h-6 text-purple-600 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{counts.video}</p>
          <p className="text-sm text-gray-600">Videos</p>
        </button>
        <button
          onClick={() => setFilterType('audio')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterType === 'audio'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <Music className="w-6 h-6 text-green-600 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{counts.audio}</p>
          <p className="text-sm text-gray-600">Audio</p>
        </button>
        <button
          onClick={() => setFilterType('quote')}
          className={`p-4 rounded-lg border-2 transition-all ${
            filterType === 'quote'
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <FileText className="w-6 h-6 text-orange-600 mb-1" />
          <p className="text-2xl font-bold text-gray-900">{counts.quote}</p>
          <p className="text-sm text-gray-600">Quotes</p>
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, patient, or tags..."
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
        <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Image
        </Button>
        <Button variant="primary" onClick={() => setShowGenerateVideoModal(true)}>
          <Video className="w-4 h-4 mr-2" />
          Generate Video
        </Button>
        <Button variant="secondary">
          <Plus className="w-4 h-4 mr-2" />
          Upload
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
      ) : media.length === 0 ? (
        <div className="text-center py-12">
          <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
          <p className="text-sm text-gray-600 mb-6">
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Start by generating or uploading media assets'}
          </p>
          <Button variant="primary" onClick={() => setShowGenerateModal(true)}>
            <Sparkles className="w-4 h-4 mr-2" />
            Generate Your First Image
          </Button>
        </div>
      ) : (
        <MediaGrid
          items={media}
          onItemClick={setSelectedItem}
          onDelete={handleDelete}
        />
      )}

      {/* Media Viewer Modal */}
      {selectedItem && (
        <MediaViewer
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Generate Image Modal */}
      <GenerateImageModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onGenerate={handleGenerateImage}
        patients={patients}
      />

      {/* Generate Video Modal */}
      <GenerateVideoModal
        isOpen={showGenerateVideoModal}
        onClose={() => setShowGenerateVideoModal(false)}
        onGenerate={handleGenerateVideo}
        patients={patients}
      />
    </div>
  );
}
