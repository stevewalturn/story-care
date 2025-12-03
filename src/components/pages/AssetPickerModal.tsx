'use client';

import { Clapperboard, FileText, Image as ImageIcon, Search, StickyNote, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type AssetType = 'media' | 'quotes' | 'notes' | 'scenes';

type MediaAsset = {
  id: string;
  mediaUrl: string;
  mediaType: 'image' | 'video' | 'audio';
  title: string | null;
  createdAt: string;
};

type QuoteAsset = {
  id: string;
  quoteText: string;
  context: string | null;
  tags: string[];
  createdAt: string;
};

type NoteAsset = {
  id: string;
  noteText: string;
  noteType: string;
  tags: string[];
  createdAt: string;
};

type SceneAsset = {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  duration: number | null;
  createdAt: string;
};

type AssetPickerModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: { type: AssetType; data: MediaAsset | QuoteAsset | NoteAsset | SceneAsset }) => void;
  patientId?: string;
  filterType?: 'image' | 'video' | 'text' | 'all';
};

export function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  patientId,
  filterType = 'all',
}: AssetPickerModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AssetType>('media');
  const [search, setSearch] = useState('');
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [quoteAssets, setQuoteAssets] = useState<QuoteAsset[]>([]);
  const [noteAssets, setNoteAssets] = useState<NoteAsset[]>([]);
  const [sceneAssets, setSceneAssets] = useState<SceneAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    }
  }, [isOpen, activeTab, patientId]);

  // Clear search when switching tabs
  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      if (activeTab === 'media') {
        const url = `/api/media${patientId ? `?patientId=${patientId}` : ''}`;
        console.log('[AssetPickerModal] Fetching media from:', url);
        console.log('[AssetPickerModal] Patient ID:', patientId);
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          console.log('[AssetPickerModal] Media data received:', data);
          console.log('[AssetPickerModal] Media count:', data.media?.length || 0);
          setMediaAssets(data.media || []);
        } else {
          console.error('[AssetPickerModal] Media fetch failed:', res.status, res.statusText);
        }
      } else if (activeTab === 'quotes') {
        const url = `/api/quotes${patientId ? `?patientId=${patientId}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setQuoteAssets(data.quotes || []);
        }
      } else if (activeTab === 'notes') {
        const url = `/api/notes${patientId ? `?patientId=${patientId}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setNoteAssets(data.notes || []);
        }
      } else if (activeTab === 'scenes') {
        const url = `/api/scenes${patientId ? `?patientId=${patientId}` : ''}`;
        const res = await authenticatedFetch(url, user);
        if (res.ok) {
          const data = await res.json();
          setSceneAssets(data.scenes || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (asset: MediaAsset | QuoteAsset | NoteAsset | SceneAsset) => {
    onSelect({ type: activeTab, data: asset });
    onClose();
  };

  const filteredMediaAssets = mediaAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== asset.mediaType) return false;
    if (!search) return true;
    return asset.title?.toLowerCase().includes(search.toLowerCase());
  });

  const filteredQuoteAssets = quoteAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== 'text') return false;
    if (!search) return true;
    return asset.quoteText.toLowerCase().includes(search.toLowerCase());
  });

  const filteredNoteAssets = noteAssets.filter((asset) => {
    if (filterType !== 'all' && filterType !== 'text') return false;
    if (!search) return true;
    return asset.noteText.toLowerCase().includes(search.toLowerCase());
  });

  const filteredSceneAssets = sceneAssets.filter((asset) => {
    if (!search) return true;
    return asset.title.toLowerCase().includes(search.toLowerCase())
      || asset.description?.toLowerCase().includes(search.toLowerCase());
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900">Browse Assets Library</h2>
          <button
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {(filterType === 'all' || filterType === 'image' || filterType === 'video') && (
            <button
              onClick={() => setActiveTab('media')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'media'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              Media
            </button>
          )}
          {(filterType === 'all' || filterType === 'text') && (
            <>
              <button
                onClick={() => setActiveTab('quotes')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'quotes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                Quotes
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'notes'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <StickyNote className="h-4 w-4" />
                Notes
              </button>
            </>
          )}
          {filterType === 'all' && (
            <button
              onClick={() => setActiveTab('scenes')}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'scenes'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <Clapperboard className="h-4 w-4" />
              Scenes
            </button>
          )}
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={
                activeTab === 'media' ? 'Search media files...' :
                activeTab === 'quotes' ? 'Search quotes...' :
                activeTab === 'notes' ? 'Search notes...' :
                'Search scenes...'
              }
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
          ) : activeTab === 'media' ? (
            // Media Grid
                <div className="grid grid-cols-3 gap-4">
                  {filteredMediaAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-500 hover:shadow-lg"
                    >
                      {asset.mediaType === 'image' ? (
                        <img src={asset.mediaUrl} alt={asset.title || 'Media'} className="h-full w-full object-cover" />
                      ) : asset.mediaType === 'video' ? (
                        <div className="flex h-full items-center justify-center bg-gray-100">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gray-100">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/50">
                        <span className="translate-y-4 text-sm font-medium text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                          Select
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredMediaAssets.length === 0 && (
                    <div className="col-span-3 py-12 text-center text-sm text-gray-500">
                      No media assets found
                    </div>
                  )}
                </div>
          ) : activeTab === 'quotes' ? (
            // Quotes List
                <div className="space-y-3">
                  {filteredQuoteAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-500 hover:shadow-md"
                    >
                      <p className="text-sm text-gray-900">
                        &quot;
                        {asset.quoteText}
                        &quot;
                      </p>
                      {asset.context && (
                        <p className="mt-2 text-xs text-gray-600">{asset.context}</p>
                      )}
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {asset.tags.map((tag, i) => (
                            <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredQuoteAssets.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No quotes found
                    </div>
                  )}
                </div>
          ) : activeTab === 'notes' ? (
            // Notes List
                <div className="space-y-3">
                  {filteredNoteAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      className="w-full rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-indigo-500 hover:shadow-md"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                          {asset.noteType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900">{asset.noteText}</p>
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {asset.tags.map((tag, i) => (
                            <span key={i} className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))}
                  {filteredNoteAssets.length === 0 && (
                    <div className="py-12 text-center text-sm text-gray-500">
                      No notes found
                    </div>
                  )}
                </div>
          ) : activeTab === 'scenes' ? (
            // Scenes Grid
                <div className="grid grid-cols-2 gap-4">
                  {filteredSceneAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => handleSelect(asset)}
                      className="group overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-500 hover:shadow-lg"
                    >
                      <div className="relative aspect-video overflow-hidden bg-gray-100">
                        {asset.thumbnailUrl ? (
                          <img src={asset.thumbnailUrl} alt={asset.title} className="h-full w-full object-cover" />
                        ) : asset.videoUrl ? (
                          <div className="flex h-full items-center justify-center bg-gray-900">
                            <Clapperboard className="h-12 w-12 text-white opacity-50" />
                          </div>
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Clapperboard className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        {asset.duration && (
                          <div className="absolute right-2 bottom-2 rounded bg-black/75 px-2 py-1 text-xs text-white">
                            {Math.floor(asset.duration / 60)}
                            :
                            {(asset.duration % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="truncate text-sm font-medium text-gray-900">{asset.title}</p>
                        {asset.description && (
                          <p className="mt-1 line-clamp-2 text-xs text-gray-600">{asset.description}</p>
                        )}
                      </div>
                    </button>
                  ))}
                  {filteredSceneAssets.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-sm text-gray-500">
                      No scenes found
                    </div>
                  )}
                </div>
          ) : null}
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
