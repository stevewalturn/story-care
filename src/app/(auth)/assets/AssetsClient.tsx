'use client';

import { ChevronDown, Download, Edit2, Eye, Frame, MoreVertical, Music, Pencil, Plus, RefreshCw, Sparkles, Trash2, Upload, Users, Video } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MediaViewer } from '@/components/assets/MediaViewer';
import { EditMediaModal } from '@/components/media/EditMediaModal';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateMusicModal } from '@/components/media/GenerateMusicModal';
import { GenerateVideoModal } from '@/components/media/GenerateVideoModal';
import { CreateNoteModal } from '@/components/notes/CreateNoteModal';
import { EditNoteModal } from '@/components/notes/EditNoteModal';
import { CreateQuoteModal } from '@/components/quotes/CreateQuoteModal';
import { EditQuoteModal } from '@/components/sessions/EditQuoteModal';
import { Button } from '@/components/ui/Button';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

type MediaItem = {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  mediaType: 'image' | 'video' | 'audio';
  mediaUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  sourceType: string;
  tags: string[] | null;
  status: string;
  createdAt: string;
  patientId: string | null;
  patientName: string;
  sessionTitle?: string;
  generationPrompt?: string | null;
  referenceImageUrl?: string | null;
};

export function AssetsClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'media' | 'quotes' | 'notes' | 'profile'>('media');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [notesData, setNotesData] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  // Quote edit/delete state
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCreateQuoteModal, setShowCreateQuoteModal] = useState(false);

  // Note create/edit/delete state
  const [showCreateNoteModal, setShowCreateNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any | null>(null);
  const [deletingNote, setDeletingNote] = useState<any | null>(null);
  const [isDeletingNote, setIsDeletingNote] = useState(false);

  // Media delete state
  const [deletingMedia, setDeletingMedia] = useState<MediaItem | null>(null);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);

  // Upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceImageInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingReferenceImage, setIsUploadingReferenceImage] = useState(false);

  // Media viewer state
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Media generation state
  const [showGenerateImageModal, setShowGenerateImageModal] = useState(false);
  const [showGenerateMusicModal, setShowGenerateMusicModal] = useState(false);
  const [showGenerateVideoModal, setShowGenerateVideoModal] = useState(false);

  // Menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // View Details state
  const [viewingMedia, setViewingMedia] = useState<MediaItem | null>(null);

  // Edit Details state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);

  // Regenerate state (for Generate New Version)
  const [regenerateImageData, setRegenerateImageData] = useState<{
    prompt: string;
    title: string;
    description: string;
    patientId: string | null;
  } | null>(null);
  const [regenerateVideoData, setRegenerateVideoData] = useState<{
    prompt: string;
    patientId: string | null;
    referenceImageUrl: string | null;
  } | null>(null);
  const [regenerateMusicData, setRegenerateMusicData] = useState<{
    prompt: string;
    title: string;
  } | null>(null);

  // Animate to Video state (use image as reference for video)
  const [animateImageData, setAnimateImageData] = useState<{
    id: string;
    url: string;
    title: string;
    patientId: string | null;
  } | null>(null);

  // In-progress tasks state
  const [inProgressTasks, setInProgressTasks] = useState<any[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Load patients on mount (only when user is available)
  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  // Load media when patient or filters change
  useEffect(() => {
    if (selectedPatient && activeTab === 'media') {
      loadMedia();
    }
  }, [selectedPatient, activeTab, filterType, searchQuery]);

  // Load quotes when patient changes and on quotes tab
  useEffect(() => {
    if (selectedPatient && activeTab === 'quotes') {
      loadQuotes();
    }
  }, [selectedPatient, activeTab, searchQuery]);

  // Load notes when patient changes and on notes tab
  useEffect(() => {
    if (selectedPatient && activeTab === 'notes') {
      loadNotes();
    }
  }, [selectedPatient, activeTab, searchQuery]);

  // Poll for in-progress tasks every 5 seconds
  useEffect(() => {
    if (selectedPatient && activeTab === 'media') {
      // Initial load
      loadInProgressTasks();

      // Set up polling interval
      const interval = setInterval(() => {
        loadInProgressTasks();
      }, 5000);

      // Cleanup interval on unmount or when dependencies change
      return () => clearInterval(interval);
    }

    return undefined;
  }, [selectedPatient, activeTab]);

  const loadPatients = async () => {
    if (!user) {
      setIsLoadingPatients(false);
      return;
    }

    try {
      setIsLoadingPatients(true);
      // Pass the therapist's Firebase UID to filter patients
      const params = new URLSearchParams({
        therapistId: user.uid,
      });

      const response = await authenticatedFetch(`/api/patients?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        if (data.patients && data.patients.length > 0) {
          setSelectedPatient(data.patients[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading patients:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const loadMedia = async () => {
    try {
      setIsLoadingMedia(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/media?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setMedia(data.media || []);
      }
    } catch (error) {
      console.error('Error loading media:', error);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const loadInProgressTasks = async () => {
    if (!selectedPatient || !user) {
      return;
    }

    try {
      setIsLoadingTasks(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
        status: 'pending,processing',
      });

      const response = await authenticatedFetch(`/api/ai/music-tasks?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setInProgressTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading in-progress tasks:', error);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const loadQuotes = async () => {
    try {
      setIsLoadingQuotes(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/quotes?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error loading quotes:', error);
    } finally {
      setIsLoadingQuotes(false);
    }
  };

  const loadNotes = async () => {
    try {
      setIsLoadingNotes(true);
      const params = new URLSearchParams({
        patientId: selectedPatient,
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const response = await authenticatedFetch(`/api/notes?${params.toString()}`, user);
      if (response.ok) {
        const data = await response.json();
        setNotesData(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  // Quote edit/delete handlers
  const handleEditQuote = async (quoteId: string, updates: { quoteText: string; tags: string[]; notes: string }) => {
    try {
      const response = await authenticatedFetch(`/api/quotes/${quoteId}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Refresh quotes list
        await loadQuotes();
        setEditingQuote(null);
      } else {
        throw new Error('Failed to update quote');
      }
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  };

  const handleDeleteQuote = async () => {
    if (!deletingQuote) return;

    try {
      setIsDeleting(true);
      const response = await authenticatedFetch(`/api/quotes/${deletingQuote.id}`, user, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh quotes list
        await loadQuotes();
        setDeletingQuote(null);
      } else {
        throw new Error('Failed to delete quote');
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateQuote = async (quoteData: { quoteText: string; tags: string[]; notes: string }) => {
    try {
      const response = await authenticatedPost('/api/quotes', user, {
        patientId: selectedPatient,
        quoteText: quoteData.quoteText,
        tags: quoteData.tags,
        notes: quoteData.notes,
      });

      if (response.ok) {
        // Refresh quotes list
        await loadQuotes();
        toast.success('Quote created successfully');
      } else {
        throw new Error('Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  // Note create/edit/delete handlers
  const handleCreateNote = async (noteData: { title: string; content: string; tags: string[] }) => {
    try {
      const response = await authenticatedPost('/api/notes', user, {
        patientId: selectedPatient,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
      });

      if (response.ok) {
        // Refresh notes list
        await loadNotes();
        toast.success('Note created successfully');
      } else {
        throw new Error('Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const handleEditNote = async (noteId: string, noteData: { title: string; content: string; tags: string[] }) => {
    try {
      const response = await authenticatedFetch(`/api/notes/${noteId}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteData),
      });

      if (response.ok) {
        // Refresh notes list
        await loadNotes();
        setEditingNote(null);
        toast.success('Note updated successfully');
      } else {
        throw new Error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const handleDeleteNote = async () => {
    if (!deletingNote) return;

    try {
      setIsDeletingNote(true);
      const response = await authenticatedFetch(`/api/notes/${deletingNote.id}`, user, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh notes list
        await loadNotes();
        setDeletingNote(null);
        toast.success('Note deleted successfully');
      } else {
        throw new Error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete note. Please try again.');
    } finally {
      setIsDeletingNote(false);
    }
  };

  const handleDeleteMedia = async () => {
    if (!deletingMedia) return;

    try {
      setIsDeletingMedia(true);
      const response = await authenticatedFetch(`/api/media/${deletingMedia.id}`, user, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh media list
        await loadMedia();
        setDeletingMedia(null);
      } else {
        throw new Error('Failed to delete media');
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      alert('Failed to delete media. Please try again.');
    } finally {
      setIsDeletingMedia(false);
    }
  };

  // View Details handler
  const handleViewDetails = (item: MediaItem) => {
    setViewingMedia(item);
  };

  // Download handler
  const handleDownload = async (item: MediaItem) => {
    if (!item.mediaUrl) {
      toast.error('No file available to download');
      return;
    }

    try {
      // Determine extension from URL or media type
      const urlPath = item.mediaUrl.split('?')[0];
      const extension = urlPath?.split('.').pop()?.toLowerCase()
        || (item.mediaType === 'image' ? 'jpg'
          : item.mediaType === 'audio' ? 'mp3' : 'mp4');

      const filename = `${item.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`;

      // Download using fetch + blob (works with presigned URLs)
      const toastId = toast.loading('Downloading...');
      const response = await fetch(item.mediaUrl);

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      toast.dismiss(toastId);
      toast.success('Download started');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };

  // Save Media Details handler (for Edit Modal)
  const handleSaveMediaDetails = async (updates: Partial<MediaItem>) => {
    if (!editingMedia || !user) return;

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/media/${editingMedia.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error('Failed to update');

      // Update local state
      setMedia(prev => prev.map(item =>
        item.id === editingMedia.id ? { ...item, ...updates } : item,
      ));
    } catch (error) {
      throw error;
    }
  };

  // Extract Last Frame handler
  const handleExtractLastFrame = async (item: MediaItem) => {
    if (item.mediaType !== 'video') {
      toast.error('Can only extract frames from videos');
      return;
    }

    if (!user) return;

    const toastId = toast.loading('Extracting last frame...');

    try {
      const idToken = await user.getIdToken();
      const response = await fetch(`/api/media/${item.id}/extract-frame`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to extract frame');
      }

      const { image } = await response.json();

      // Add to top of media list
      setMedia(prev => [image, ...prev]);

      toast.dismiss(toastId);
      toast.success('Last frame extracted and saved to library');
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Failed to extract last frame');
    }
  };

  // Generate New Version handler
  const handleGenerateNewVersion = (item: MediaItem) => {
    if (!item.generationPrompt) {
      toast.error('No generation prompt available for this media');
      return;
    }

    if (item.mediaType === 'image') {
      setRegenerateImageData({
        prompt: item.generationPrompt,
        title: `${item.title} - Variation`,
        description: item.description || '',
        patientId: item.patientId,
      });
      setShowGenerateImageModal(true);
    } else if (item.mediaType === 'video') {
      // Open video modal with original prompt and reference image for regeneration
      setRegenerateVideoData({
        prompt: item.generationPrompt,
        patientId: item.patientId,
        referenceImageUrl: item.referenceImageUrl || null,
      });
      setAnimateImageData(null); // Clear any animate data
      setShowGenerateVideoModal(true);
    } else if (item.mediaType === 'audio') {
      setRegenerateMusicData({
        prompt: item.generationPrompt,
        title: `${item.title} - Variation`,
      });
      setShowGenerateMusicModal(true);
    }
  };

  // Animate to Video handler (use image as reference for video generation)
  const handleAnimateToVideo = (item: MediaItem) => {
    if (item.mediaType !== 'image') {
      toast.error('Can only animate images to video');
      return;
    }

    // Set the image as reference for video generation
    setAnimateImageData({
      id: item.id,
      url: item.mediaUrl,
      title: item.title,
      patientId: item.patientId,
    });
    setRegenerateVideoData(null); // Clear any regenerate data
    setShowGenerateVideoModal(true);
  };

  const handleMediaClick = (item: MediaItem) => {
    setSelectedMediaItem(item);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMediaItem(null);
  };

  const handleUploadClick = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }
    setShowUploadModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      // Auto-fill title with filename (without extension)
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      setUploadTitle(nameWithoutExt);
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !selectedPatient || !user) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading file...');

    try {
      // Step 1: Upload file to GCS
      const formData = new FormData();
      formData.append('file', uploadFile);

      const token = await user.getIdToken();

      const uploadResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();

      // Step 2: Save media entry to database
      toast.loading('Saving to database...', { id: toastId });

      const mediaResponse = await authenticatedPost('/api/media', user, {
        patientId: selectedPatient,
        createdByTherapistId: user.uid,
        title: uploadTitle || uploadFile.name,
        description: uploadDescription || null,
        mediaType: uploadData.mediaType,
        mediaUrl: uploadData.path, // Save GCS path, not temporary URL
        thumbnailUrl: uploadData.mediaType === 'image' ? uploadData.path : null,
        sourceType: 'uploaded',
      });

      if (!mediaResponse.ok) {
        throw new Error('Failed to save media to database');
      }

      toast.success('File uploaded successfully!', { id: toastId });

      // Close modal and reset
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle('');
      setUploadDescription('');

      // Refresh media list
      await loadMedia();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'today';
    }
    if (diffDays === 1) {
      return '1 day ago';
    }
    if (diffDays < 30) {
      return `${diffDays} days ago`;
    }
    if (diffDays < 365) {
      return `${Math.floor(diffDays / 30)} months ago`;
    }
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const formatTimeElapsed = (dateString: string) => {
    const now = new Date();
    const created = new Date(dateString);
    const diffSeconds = Math.floor((now.getTime() - created.getTime()) / 1000);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    }
    if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}m ago`;
    }
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const handleReferenceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPatient || !user) return;

    setIsUploadingReferenceImage(true);
    const toastId = toast.loading('Uploading reference image...');

    try {
      // Upload file to GCS
      const formData = new FormData();
      formData.append('file', file);

      const token = await user.getIdToken();

      const uploadResponse = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const uploadData = await uploadResponse.json();

      // Update patient's reference image
      const updateResponse = await authenticatedFetch(`/api/patients/${selectedPatient}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImageUrl: uploadData.path,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update patient reference image');
      }

      // Refresh patients list to show updated image
      await loadPatients();
      toast.success('Reference image updated!', { id: toastId });
    } catch (error: any) {
      console.error('Reference image upload error:', error);
      toast.error(`Upload failed: ${error.message}`, { id: toastId });
    } finally {
      setIsUploadingReferenceImage(false);
      // Reset the input
      if (referenceImageInputRef.current) {
        referenceImageInputRef.current.value = '';
      }
    }
  };

  const selectedPatientData = patients.find(p => p.id === selectedPatient);

  // Loading state while fetching patients
  if (isLoadingPatients) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  // Empty state when no patients (only after loading completes)
  if (patients.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
        <div className="max-w-md text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-purple-100">
            <Users className="h-12 w-12 text-purple-600" />
          </div>

          {/* Heading */}
          <h1 className="mb-3 text-3xl font-bold text-gray-900">
            No Patients Yet
          </h1>

          {/* Description */}
          <p className="mb-8 text-base text-gray-600">
            Add your first patient to start building their content library with media, quotes, and notes
          </p>

          {/* CTA Button */}
          <Link href="/patients">
            <button className="inline-flex items-center rounded-lg bg-gradient-to-r from-purple-600 to-purple-600 px-6 py-3 text-base font-medium text-white shadow-lg transition-all hover:from-purple-700 hover:to-purple-700 hover:shadow-xl">
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Patient
            </button>
          </Link>

          {/* Additional Info */}
          <div className="mt-12 rounded-lg border border-gray-200 bg-white p-6 text-left shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-gray-900">
              What you can do with the Content Library:
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="mt-0.5 mr-2 text-purple-600">•</span>
                <span>Store and organize patient media (images, videos, audio)</span>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-2 text-purple-600">•</span>
                <span>Save meaningful quotes from therapy sessions</span>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-2 text-purple-600">•</span>
                <span>Keep session notes and observations</span>
              </li>
              <li className="flex items-start">
                <span className="mt-0.5 mr-2 text-purple-600">•</span>
                <span>Build personalized story pages for patients</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Library</h1>
            <p className="mt-1 text-sm text-gray-500">Browse and manage patient content across sessions</p>
          </div>
        </div>

        {/* Patient Selector with Avatar */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-sm text-gray-600">Viewing library for:</span>
          <div className="relative">
            <button
              onClick={() => setShowPatientDropdown(!showPatientDropdown)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400 focus:border-purple-500 focus:outline-none"
            >
              {(() => {
                const selectedPatientData = patients.find(p => p.id === selectedPatient);
                if (selectedPatientData?.avatarUrl || selectedPatientData?.referenceImageUrl) {
                  return (
                    <img
                      src={selectedPatientData.avatarUrl || selectedPatientData.referenceImageUrl}
                      alt={selectedPatientData.name}
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  );
                }
                return (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                    {selectedPatientData?.name?.charAt(0) || '?'}
                  </div>
                );
              })()}
              <span>{patients.find(p => p.id === selectedPatient)?.name || 'Select patient'}</span>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showPatientDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showPatientDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowPatientDropdown(false)}
                />
                <div className="absolute top-full left-0 z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {patients.map(patient => (
                    <button
                      key={patient.id}
                      onClick={() => {
                        setSelectedPatient(patient.id);
                        setShowPatientDropdown(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                        patient.id === selectedPatient ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {patient.avatarUrl || patient.referenceImageUrl ? (
                        <img
                          src={patient.avatarUrl || patient.referenceImageUrl}
                          alt={patient.name}
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500 text-xs font-medium text-white">
                          {patient.name?.charAt(0) || '?'}
                        </div>
                      )}
                      <span>{patient.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="-mb-px flex gap-8 border-b border-gray-200">
          {['Media', 'Quotes', 'Notes', 'Profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`relative border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Media Tab */}
      {activeTab === 'media' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">
                  Media
                </h2>
                <button
                  onClick={() => {
                    loadMedia();
                    loadInProgressTasks();
                  }}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Refresh media and tasks"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUploadClick}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowGenerateImageModal(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Media
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 flex items-center gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search media..."
                  className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-purple-500 focus:outline-none"
                />
                <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={filterSource}
                onChange={e => setFilterSource(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Sources</option>
                <option value="generated">Generated</option>
                <option value="uploaded">Uploaded</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Type Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterType === 'video'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterType === 'image'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Images
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  filterType === 'audio'
                    ? 'bg-gray-900 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Music
              </button>
            </div>
          </div>

          {/* In-Progress Tasks */}
          {inProgressTasks.length > 0 && (
            <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-50 px-6 py-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 animate-pulse text-purple-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Generating Music (
                    {inProgressTasks.length}
                    {' '}
                    in progress)
                  </h3>
                </div>
                <button
                  onClick={() => loadInProgressTasks()}
                  className="rounded-lg p-1.5 text-purple-600 transition-colors hover:bg-purple-100"
                  title="Refresh task status from Suno"
                  disabled={isLoadingTasks}
                >
                  <svg
                    className={`h-4 w-4 ${isLoadingTasks ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <div
                    key={task.id}
                    className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {task.title || 'Untitled Music'}
                        </h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              task.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {task.status === 'pending' ? '⏳ Pending' : '🎵 Processing'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeElapsed(task.createdAt)}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span className="font-mono text-xs text-gray-400">
                            Task ID:
                            {' '}
                            {task.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="relative h-2 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-purple-500 transition-all duration-500 ease-out"
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                    <div className="mt-1 text-right text-xs text-gray-600">
                      {task.progress || 0}
                      %
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingMedia ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading media...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No media found</p>
                <p className="mt-1 text-xs text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {media.map(item => (
                  <div
                    key={item.id}
                    className="group flex cursor-pointer gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
                    onClick={() => handleMediaClick(item)}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-24 w-36 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {item.mediaType === 'video'
                        ? (
                            <>
                              {item.thumbnailUrl
                                ? (
                                    <img
                                      src={item.thumbnailUrl}
                                      alt={item.title}
                                      className="h-full w-full object-cover"
                                    />
                                  )
                                : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                    </div>
                                  )}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="rounded-full bg-white/90 p-2">
                                  <svg className="h-5 w-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                  </svg>
                                </div>
                              </div>
                            </>
                          )
                        : item.mediaType === 'image'
                          ? (
                              <img
                                src={item.thumbnailUrl || item.mediaUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                            )
                          : (
                              <div className="flex h-full w-full items-center justify-center bg-purple-50">
                                <Music className="h-12 w-12 text-purple-400" />
                              </div>
                            )}
                      {/* Processing status overlay */}
                      {item.status === 'processing' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <div className="text-center">
                            <div className="mx-auto mb-1 h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            <span className="text-xs font-medium text-white">Processing...</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-base font-semibold text-gray-900">
                            {item.title}
                          </h3>
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                            {item.mediaType === 'video' && <Video className="h-4 w-4" />}
                            {item.mediaType === 'image' && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                            {item.mediaType === 'audio' && <Music className="h-4 w-4" />}
                            <span className="capitalize">{item.mediaType}</span>
                            <span>•</span>
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                            {item.description || 'No description'}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.tags && item.tags.length > 0 && item.tags.map((tag: string, idx: number) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                  tag.toLowerCase() === 'generated'
                                    ? 'border border-green-200 bg-green-50 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                            {item.sourceType && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                {item.sourceType.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className="flex-shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                          >
                            <MoreVertical className="h-5 w-5" />
                          </button>

                          {openMenuId === item.id && (
                            <>
                              {/* Backdrop */}
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenMenuId(null)}
                              />

                              {/* Dropdown Menu */}
                              <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                                {/* View Details */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    handleViewDetails(item);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Eye className="h-4 w-4" />
                                  View Details
                                </button>

                                {/* Download */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    handleDownload(item);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Download className="h-4 w-4" />
                                  Download
                                </button>

                                {/* Edit Details */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setEditingMedia(item);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit2 className="h-4 w-4" />
                                  Edit Details
                                </button>

                                {/* Extract Last Frame - Video only */}
                                {item.mediaType === 'video' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleExtractLastFrame(item);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Frame className="h-4 w-4" />
                                    Extract Last Frame
                                  </button>
                                )}

                                {/* Generate New Version - only show if generation prompt exists */}
                                {(item.mediaType === 'image' || item.mediaType === 'video' || item.mediaType === 'audio') && item.generationPrompt && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleGenerateNewVersion(item);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Sparkles className="h-4 w-4" />
                                    Generate New Version
                                  </button>
                                )}

                                {/* Animate to Video - Image only */}
                                {item.mediaType === 'image' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuId(null);
                                      handleAnimateToVideo(item);
                                    }}
                                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                                  >
                                    <Video className="h-4 w-4" />
                                    Animate to Video
                                  </button>
                                )}

                                <hr className="my-1" />

                                {/* Delete */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setDeletingMedia(item);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Quotes</h2>
                <button
                  onClick={() => loadQuotes()}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Refresh quotes"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateQuoteModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Quote
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search quotes..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-purple-500 focus:outline-none"
              />
              <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">

            {isLoadingQuotes
              ? (
                  <div className="py-12 text-center">
                    <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                    <p className="text-sm text-gray-500">Loading quotes...</p>
                  </div>
                )
              : quotes.length === 0
                ? (
                    <div className="py-12 text-center">
                      <p className="text-sm text-gray-500">No quotes found</p>
                    </div>
                  )
                : (
                    <div className="space-y-4">
                      {quotes.map(quote => (
                        <div
                          key={quote.id}
                          className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-sm"
                        >
                          <div className="mb-3 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">
                                {quote.speakerName || 'Unknown'}
                              </span>
                              {quote.startTimeSeconds && (
                                <span className="text-sm text-gray-500">
                                  {Math.floor(Number(quote.startTimeSeconds) / 60)}
                                  :
                                  {(Number(quote.startTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                                  {' '}
                                  -
                                  {Math.floor(Number(quote.endTimeSeconds) / 60)}
                                  :
                                  {(Number(quote.endTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setEditingQuote(quote)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                                title="Edit quote"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setDeletingQuote(quote)}
                                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete quote"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Quote Content - Markdown rendered */}
                          <div className="prose prose-sm mb-4 max-w-none text-gray-700 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {quote.quoteText}
                            </ReactMarkdown>
                          </div>

                          {quote.tags && quote.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {quote.tags.map((tag: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
          </div>
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Controls */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                <button
                  onClick={() => loadNotes()}
                  className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  title="Refresh notes"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateNoteModal(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Note
              </Button>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-purple-500 focus:outline-none"
              />
              <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading State */}
            {isLoadingNotes && (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading notes...</p>
              </div>
            )}

            {/* Empty State */}
            {!isLoadingNotes && notesData.length === 0 && (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-sm text-gray-500">
                  {searchQuery ? 'No notes found matching your search' : 'No notes yet'}
                </p>
              </div>
            )}

            {/* Notes List */}
            {!isLoadingNotes && notesData.length > 0 && (
              <div className="space-y-4">
                {notesData.map(note => (
                  <div
                    key={note.id}
                    className="rounded-lg border border-gray-200 bg-white p-6 transition-all hover:border-purple-300 hover:shadow-md"
                  >
                    {/* Note Header */}
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="mb-1 text-base font-semibold text-gray-900">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(note.createdAt)}</span>
                          {note.updatedAt && note.updatedAt !== note.createdAt && (
                            <>
                              <span>•</span>
                              <span>
                                Updated
                                {formatDate(note.updatedAt)}
                              </span>
                            </>
                          )}
                          {note.sessionTitle && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {note.sessionTitle}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingNote(note)}
                          className="text-gray-400 transition-colors hover:text-purple-600"
                          title="Edit note"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingNote(note)}
                          className="text-gray-400 transition-colors hover:text-red-600"
                          title="Delete note"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Note Content - Markdown rendered */}
                    <div className="prose prose-sm mb-3 max-w-none text-gray-700 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {note.content}
                      </ReactMarkdown>
                    </div>

                    {/* Tags */}
                    {note.tags && note.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {note.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="mx-auto max-w-4xl p-6">
            {selectedPatientData ? (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                  <div className="h-24 bg-gradient-to-r from-purple-500 to-purple-600" />
                  <div className="px-6 pb-6">
                    <div className="-mt-12 mb-4 flex items-start">
                      <div className="relative">
                        {selectedPatientData.referenceImageUrl
                          ? (
                              <img
                                src={selectedPatientData.referenceImageUrl}
                                alt={selectedPatientData.name}
                                className="h-24 w-24 rounded-full border-4 border-white object-cover"
                              />
                            )
                          : (
                              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-purple-100">
                                <span className="text-3xl font-semibold text-purple-600">
                                  {selectedPatientData.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                      </div>
                      <div className="ml-4 flex-1 pt-14">
                        <h2 className="text-2xl font-bold text-gray-900">{selectedPatientData.name}</h2>
                        <p className="text-sm text-gray-500">{selectedPatientData.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Information Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Patient Information</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Patient ID
                      </label>
                      <p className="font-mono text-sm text-gray-900">{selectedPatientData.id}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Email
                      </label>
                      <p className="text-sm text-gray-900">{selectedPatientData.email}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Account Created
                      </label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPatientData.createdAt)}</p>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium tracking-wide text-gray-500 uppercase">
                        Last Updated
                      </label>
                      <p className="text-sm text-gray-900">{formatDate(selectedPatientData.updatedAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Reference Image Card */}
                {selectedPatientData.referenceImageUrl && (
                  <div className="rounded-lg border border-gray-200 bg-white p-6">
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Reference Image</h3>
                    <p className="mb-4 text-sm text-gray-600">
                      This image is used as a reference for AI-generated content to ensure visual consistency.
                    </p>
                    <div className="relative mx-auto w-full max-w-md">
                      <img
                        src={selectedPatientData.referenceImageUrl}
                        alt="Reference image"
                        className="h-auto w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                )}

                {/* Statistics Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Content Statistics</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{media.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Media Items</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">{quotes.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Quotes</div>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{notesData.length}</div>
                      <div className="mt-1 text-xs text-gray-600">Notes</div>
                    </div>
                    <div className="rounded-lg bg-yellow-50 p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-600">
                        {media.filter((m: any) => m.mediaType === 'image').length}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Images</div>
                    </div>
                  </div>
                </div>

                {/* Actions Card */}
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h3 className="mb-4 text-lg font-semibold text-gray-900">Actions</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => router.push(`/patients?edit=${selectedPatient}`)}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      <Pencil className="mr-2 inline h-4 w-4" />
                      Edit Profile
                    </button>
                    <button
                      onClick={() => referenceImageInputRef.current?.click()}
                      disabled={isUploadingReferenceImage}
                      className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                    >
                      <Upload className="mr-2 inline h-4 w-4" />
                      {isUploadingReferenceImage ? 'Uploading...' : 'Update Reference Image'}
                    </button>
                    <button
                      onClick={() => router.push(`/sessions?patientId=${selectedPatient}`)}
                      className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      View Sessions
                    </button>
                    <button
                      onClick={() => router.push(`/pages?patientId=${selectedPatient}`)}
                      className="rounded-lg bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
                    >
                      View Story Pages
                    </button>
                  </div>
                  {/* Hidden file input for reference image */}
                  <input
                    ref={referenceImageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReferenceImageUpload}
                    className="hidden"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <svg className="mx-auto mb-4 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <p className="text-sm text-gray-500">Please select a patient to view their profile</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={showCreateQuoteModal}
        onClose={() => setShowCreateQuoteModal(false)}
        patientId={selectedPatient}
        onSave={handleCreateQuote}
      />

      {/* Edit Quote Modal */}
      {editingQuote && (
        <EditQuoteModal
          isOpen={!!editingQuote}
          onClose={() => setEditingQuote(null)}
          quote={editingQuote}
          onSave={handleEditQuote}
        />
      )}

      {/* Create Note Modal */}
      <CreateNoteModal
        isOpen={showCreateNoteModal}
        onClose={() => setShowCreateNoteModal(false)}
        patientId={selectedPatient}
        onSave={handleCreateNote}
      />

      {/* Edit Note Modal */}
      {editingNote && (
        <EditNoteModal
          isOpen={!!editingNote}
          onClose={() => setEditingNote(null)}
          note={editingNote}
          onSave={handleEditNote}
        />
      )}

      {/* Delete Quote Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingQuote}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleDeleteQuote}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Delete Note Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleDeleteNote}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        isDeleting={isDeletingNote}
      />

      {/* Delete Media Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingMedia}
        onClose={() => setDeletingMedia(null)}
        onConfirm={handleDeleteMedia}
        title="Delete Media"
        message={`Are you sure you want to delete "${deletingMedia?.title}"? This action cannot be undone and will remove the media from the patient's library.`}
        isDeleting={isDeletingMedia}
      />

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Upload Media</h2>

            <div className="space-y-4">
              {/* File Input */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Select File
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={handleFileSelect}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
                {uploadFile && (
                  <p className="mt-1 text-xs text-gray-500">
                    Selected:
                    {' '}
                    {uploadFile.name}
                    {' '}
                    (
                    {(uploadFile.size / 1024 / 1024).toFixed(2)}
                    {' '}
                    MB)
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  placeholder="Enter media title"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              {/* Description (Optional) */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description
                  {' '}
                  <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={e => setUploadDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadTitle('');
                  setUploadDescription('');
                }}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!uploadFile || isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Media Viewer Modal */}
      {isViewerOpen && selectedMediaItem && (
        <MediaViewer
          item={{
            id: selectedMediaItem.id,
            type: selectedMediaItem.mediaType,
            title: selectedMediaItem.title,
            url: selectedMediaItem.mediaUrl,
            thumbnailUrl: selectedMediaItem.thumbnailUrl || undefined,
            patientName: selectedMediaItem.patientName,
            sessionName: selectedMediaItem.sessionTitle,
            createdAt: new Date(selectedMediaItem.createdAt),
            duration: selectedMediaItem.durationSeconds || undefined,
            tags: selectedMediaItem.tags || undefined,
            prompt: selectedMediaItem.generationPrompt || undefined,
          }}
          onClose={handleCloseViewer}
        />
      )}

      {/* Generate Image Modal */}
      {showGenerateImageModal && (
        <GenerateImageModal
          isOpen={showGenerateImageModal}
          onClose={() => {
            setShowGenerateImageModal(false);
            setRegenerateImageData(null);
          }}
          onGenerate={async (
            prompt,
            model,
            useReference,
            referenceImage,
            metadata,
          ) => {
            // Call the API to generate the image
            const response = await authenticatedPost('/api/ai/generate-image', user, {
              prompt,
              model,
              useReference,
              referenceImage,
              patientId: regenerateImageData?.patientId || selectedPatient,
              title: metadata?.title,
              description: metadata?.description,
              sourceQuote: metadata?.sourceQuote,
              style: metadata?.style,
            });

            if (!response.ok) {
              throw new Error('Failed to generate image');
            }

            // Refresh the media list
            await loadMedia();
            setRegenerateImageData(null);
            toast.success('Image generated successfully!');
          }}
          patients={patients}
          patientId={regenerateImageData?.patientId || selectedPatient || undefined}
          initialPrompt={regenerateImageData?.prompt || ''}
          initialTitle={regenerateImageData?.title || ''}
          initialDescription={regenerateImageData?.description || ''}
        />
      )}

      {/* Generate Music Modal */}
      {showGenerateMusicModal && (
        <GenerateMusicModal
          isOpen={showGenerateMusicModal}
          onClose={() => {
            setShowGenerateMusicModal(false);
            setRegenerateMusicData(null);
          }}
          patientId={selectedPatient}
          user={user}
          instrumentalOption={regenerateMusicData ? {
            title: regenerateMusicData.title,
            music_description: regenerateMusicData.prompt,
          } : {
            title: 'Therapeutic Music',
            music_description: 'Create therapeutic music for this patient',
          }}
          lyricalOption={regenerateMusicData ? {
            title: regenerateMusicData.title,
            music_description: regenerateMusicData.prompt,
          } : {
            title: 'Lyrical Therapeutic Song',
            music_description: 'Create a song with meaningful lyrics for this patient',
          }}
          onComplete={() => {
            // Refresh media list and tasks when music generation completes
            loadMedia();
            loadInProgressTasks();
            setRegenerateMusicData(null);
          }}
        />
      )}

      {/* Generate Video Modal (for regeneration and animate image to video) */}
      {showGenerateVideoModal && (
        <GenerateVideoModal
          isOpen={showGenerateVideoModal}
          onClose={() => {
            setShowGenerateVideoModal(false);
            setAnimateImageData(null);
            setRegenerateVideoData(null);
          }}
          onGenerate={async (_videoUrl: string, _prompt: string) => {
            // Refresh the media list when video is generated
            await loadMedia();
            await loadInProgressTasks();
            toast.success('Video generated successfully!');
          }}
          initialPrompt={regenerateVideoData?.prompt || ''}
          patientId={animateImageData?.patientId || regenerateVideoData?.patientId || selectedPatient || undefined}
          referenceImage={animateImageData ? {
            id: animateImageData.id,
            url: animateImageData.url,
            title: animateImageData.title,
          } : regenerateVideoData?.referenceImageUrl ? {
            id: 'regenerate-ref',
            url: regenerateVideoData.referenceImageUrl,
            title: 'Original reference',
          } : undefined}
        />
      )}

      {/* View Details Modal */}
      {viewingMedia && (
        <MediaViewer
          item={{
            ...viewingMedia,
            url: viewingMedia.mediaUrl,
            type: viewingMedia.mediaType as 'image' | 'video' | 'audio',
            createdAt: new Date(viewingMedia.createdAt),
            thumbnailUrl: viewingMedia.thumbnailUrl ?? undefined,
            tags: viewingMedia.tags ?? undefined,
          }}
          onClose={() => setViewingMedia(null)}
        />
      )}

      {/* Edit Media Modal */}
      {editingMedia && (
        <EditMediaModal
          isOpen={!!editingMedia}
          onClose={() => setEditingMedia(null)}
          media={editingMedia}
          onSave={handleSaveMediaDetails}
        />
      )}
    </div>
  );
}
