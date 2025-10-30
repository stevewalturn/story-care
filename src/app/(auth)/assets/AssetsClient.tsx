'use client';

import { useState } from 'react';
import { Search, Filter, Plus, Image, Video, Music, FileText, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { MediaGrid } from '@/components/assets/MediaGrid';
import { MediaViewer } from '@/components/assets/MediaViewer';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateVideoModal } from '@/components/media/GenerateVideoModal';

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

export function AssetsClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showGenerateVideoModal, setShowGenerateVideoModal] = useState(false);

  // Mock data - In real implementation, this would come from API
  const mockMedia: MediaItem[] = [
    {
      id: '1',
      type: 'image',
      title: 'Hope Rising',
      url: '/images/generated/hope-rising.jpg',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
      patientName: 'Emma Wilson',
      sessionName: 'Session with Emma - Oct 15',
      createdAt: new Date(2025, 9, 15),
      tags: ['hope', 'resilience', 'nature'],
      prompt: 'A serene mountain landscape at sunrise, symbolizing hope and new beginnings',
    },
    {
      id: '2',
      type: 'video',
      title: 'Journey of Healing',
      url: '/videos/generated/journey.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop',
      patientName: 'Emma Wilson',
      sessionName: 'Session with Emma - Oct 20',
      createdAt: new Date(2025, 9, 20),
      duration: 125,
      tags: ['journey', 'growth', 'transformation'],
      prompt: 'A visual journey through forest paths, symbolizing personal growth',
    },
    {
      id: '3',
      type: 'quote',
      title: 'Strength Quote',
      url: '',
      text: "I'm stronger than I thought. Even in difficult moments, there's a part of me that knows how to cope.",
      patientName: 'Emma Wilson',
      sessionName: 'Session with Emma - Oct 22',
      createdAt: new Date(2025, 9, 22),
      tags: ['strength', 'resilience', 'self-awareness'],
    },
    {
      id: '4',
      type: 'audio',
      title: 'Reflection Background Music',
      url: '/audio/generated/reflection.mp3',
      patientName: 'Emma Wilson',
      sessionName: 'Session with Emma - Oct 25',
      createdAt: new Date(2025, 9, 25),
      duration: 180,
      tags: ['ambient', 'calming', 'meditation'],
    },
    {
      id: '5',
      type: 'image',
      title: 'Inner Peace',
      url: '/images/generated/inner-peace.jpg',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      patientName: 'Michael Chen',
      sessionName: 'Session with Michael - Oct 28',
      createdAt: new Date(2025, 9, 28),
      tags: ['peace', 'mindfulness', 'balance'],
      prompt: 'A tranquil zen garden with carefully placed stones and flowing water',
    },
    {
      id: '6',
      type: 'video',
      title: 'Overcoming Challenges',
      url: '/videos/generated/overcoming.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=400&h=400&fit=crop',
      patientName: 'Sarah Martinez',
      sessionName: 'Group Therapy - Oct 29',
      createdAt: new Date(2025, 9, 29),
      duration: 95,
      tags: ['resilience', 'courage', 'triumph'],
      prompt: 'A person climbing a mountain, reaching the summit at golden hour',
    },
  ];

  const filterOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'quote', label: 'Quotes' },
  ];

  // Filter media based on search and type
  const filteredMedia = mockMedia.filter((item) => {
    const matchesSearch =
      searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || item.type === filterType;

    return matchesSearch && matchesType;
  });

  const handleDelete = (itemId: string) => {
    // In real implementation, call API to delete
    console.log('Deleting item:', itemId);
  };

  const handleGenerateImage = (imageUrl: string, prompt: string) => {
    // In real implementation, save to API
    const newImage: MediaItem = {
      id: Date.now().toString(),
      type: 'image',
      title: prompt.slice(0, 50),
      url: imageUrl,
      thumbnailUrl: imageUrl,
      createdAt: new Date(),
      tags: ['ai-generated'],
      prompt,
    };
    console.log('Generated image:', newImage);
    // mockMedia.push(newImage); // Would update state in real implementation
  };

  const handleGenerateVideo = (videoUrl: string, prompt: string) => {
    // In real implementation, save to API
    const newVideo: MediaItem = {
      id: Date.now().toString(),
      type: 'video',
      title: prompt.slice(0, 50),
      url: videoUrl,
      thumbnailUrl: videoUrl,
      createdAt: new Date(),
      tags: ['ai-generated'],
      prompt,
    };
    console.log('Generated video:', newVideo);
    // mockMedia.push(newVideo); // Would update state in real implementation
  };

  // Mock patients for image generation
  const mockPatients = [
    { id: '1', name: 'Emma Wilson', avatarUrl: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Michael Chen', avatarUrl: 'https://i.pravatar.cc/150?img=3' },
    { id: '3', name: 'Sarah Martinez' },
  ];

  // Count by type
  const counts = {
    all: mockMedia.length,
    image: mockMedia.filter((m) => m.type === 'image').length,
    video: mockMedia.filter((m) => m.type === 'video').length,
    audio: mockMedia.filter((m) => m.type === 'audio').length,
    quote: mockMedia.filter((m) => m.type === 'quote').length,
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

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, patient, or tags..."
            icon={<Search className="w-4 h-4" />}
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

      {/* Media Grid */}
      <MediaGrid
        items={filteredMedia}
        onItemClick={setSelectedItem}
        onDelete={handleDelete}
      />

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
        patients={mockPatients}
      />

      {/* Generate Video Modal */}
      <GenerateVideoModal
        isOpen={showGenerateVideoModal}
        onClose={() => setShowGenerateVideoModal(false)}
        onGenerate={handleGenerateVideo}
        patients={mockPatients}
      />
    </div>
  );
}
