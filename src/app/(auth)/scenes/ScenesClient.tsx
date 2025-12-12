'use client';

import { ArrowLeft, Download, Eye, Loader2, Music, Play, Save } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { MediaViewer } from '@/components/assets/MediaViewer';
import { ClipLibrary } from '@/components/scenes/ClipLibrary';
import { ScenePreviewPlayer } from '@/components/scenes/ScenePreviewPlayer';
import { SceneTimeline } from '@/components/scenes/SceneTimeline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoJobPolling } from '@/hooks/useVideoJobPolling';
import { authenticatedFetch, authenticatedPost, authenticatedPut } from '@/utils/AuthenticatedFetch';

type Clip = {
  id: string;
  type: 'video' | 'image';
  mediaId: string;
  title: string;
  thumbnailUrl: string;
  startTime: number;
  duration: number;
  audioTrack?: string;
};

type AudioTrack = {
  id: string;
  audioId: string;
  audioUrl: string;
  title: string;
  startTime: number;
  duration: number;
};

type MediaItem = {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  mediaUrl?: string;
  duration?: number;
};

type ScenesClientProps = {
  initialSceneId?: string | null;
  onBackToLibrary?: () => void;
};

export function ScenesClient({ initialSceneId, onBackToLibrary }: ScenesClientProps) {
  const { user } = useAuth();
  const [sceneName, setSceneName] = useState('Untitled Scene');
  const [sceneDescription, setSceneDescription] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(initialSceneId || null);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [patients, setPatients] = useState<any[]>([]);

  // Audio settings
  const [loopAudio, setLoopAudio] = useState(false);
  const [fitAudioToDuration, setFitAudioToDuration] = useState(false);

  // Assembled video URL
  const [assembledVideoUrl, setAssembledVideoUrl] = useState<string | null>(null);

  // Video job polling state
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [lastFailedJob, setLastFailedJob] = useState<{ errorMessage: string; jobId: string } | null>(null);

  // Use video job polling hook
  const { job: videoJob, isProcessing } = useVideoJobPolling({
    sceneId: currentSceneId || undefined,
    enabled: pollingEnabled && !!currentSceneId,
    pollInterval: 2000,
    onComplete: (job) => {
      toast.success('Video assembly completed!', { duration: 5000 });
      setAssembledVideoUrl(job.assembledVideoUrl || null);
      setPollingEnabled(false);
      setIsExporting(false);

      // Auto-display the exported video
      if (job.assembledVideoUrl) {
        setPreviewVideoUrl(job.assembledVideoUrl);
        setIsViewerOpen(true);
      }

      // Refresh scene to get updated data
      if (currentSceneId) {
        loadScene(currentSceneId);
      }
    },
    onError: (error) => {
      toast.error(`Video assembly failed: ${error}`);
      setPollingEnabled(false);
      setIsExporting(false);
    },
  });

  // Calculate total duration automatically from both clips and audio tracks
  const totalDuration = useMemo(() => {
    const clipsEndTime = clips.reduce((max, clip) =>
      Math.max(max, clip.startTime + clip.duration), 0);
    const audioEndTime = audioTracks.reduce((max, track) =>
      Math.max(max, track.startTime + track.duration), 0);
    const calculatedDuration = Math.max(clipsEndTime, audioEndTime);
    // Minimum 60 seconds, round up to nearest 10
    return Math.max(60, Math.ceil(calculatedDuration / 10) * 10);
  }, [clips, audioTracks]);

  // Preview modal states
  const [showInstantPreview, setShowInstantPreview] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Load initial scene if provided
  useEffect(() => {
    if (initialSceneId) {
      loadScene(initialSceneId);
    }
  }, [initialSceneId]);

  // Load patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Check for ongoing jobs when scene changes or on mount
  useEffect(() => {
    const checkForOngoingJob = async () => {
      if (!currentSceneId || !user) return;

      try {
        const response = await authenticatedFetch(
          `/api/scenes/${currentSceneId}/assemble-async`,
          user,
        );

        if (response.ok) {
          const data = await response.json();

          // If job is pending or processing, enable polling
          if (data.status === 'pending' || data.status === 'processing') {
            setPollingEnabled(true);
            setIsExporting(true);

            toast.loading(
              'Video assembly in progress... Detected ongoing job.',
              { id: 'processing-toast' },
            );
          }

          // If job failed, show the error
          if (data.status === 'failed' && data.errorMessage) {
            setLastFailedJob({
              errorMessage: data.errorMessage,
              jobId: data.jobId,
            });
          }
        }
      } catch (error) {
        // Job might not exist, which is fine - user hasn't exported yet
        console.log('No ongoing job found for this scene');
      }
    };

    checkForOngoingJob();
  }, [currentSceneId, user]);

  // Load scenes when patient changes

  const fetchPatients = async () => {
    try {
      const response = await authenticatedFetch('/api/patients', user);
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
        if (data.patients && data.patients.length > 0) {
          setSelectedPatient(data.patients[0].id);
        }
      } else {
        toast.error('Failed to load patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast.error('Error loading patients');
    }
  };

  const loadScene = async (sceneId: string) => {
    try {
      const response = await authenticatedFetch(`/api/scenes/${sceneId}`, user);
      if (response.ok) {
        const data = await response.json();
        setCurrentSceneId(sceneId);
        setSceneName(data.scene.title || 'Untitled Scene');
        setSceneDescription(data.scene.description || '');

        // Load audio settings
        setLoopAudio(data.scene.loopAudio || false);
        setFitAudioToDuration(data.scene.fitAudioToDuration || false);

        // Transform clips from API format with presigned URLs
        const transformedClips: Clip[] = data.clips.map((clip: any) => ({
          id: clip.id,
          type: clip.media?.mediaType || 'image',
          mediaId: clip.mediaId,
          title: `Clip ${clip.sequenceNumber}`,
          thumbnailUrl: clip.media?.thumbnailUrl || clip.media?.mediaUrl || '',
          startTime: Number.parseFloat(clip.startTimeSeconds),
          duration: Number.parseFloat(clip.endTimeSeconds) - Number.parseFloat(clip.startTimeSeconds),
        }));

        setClips(transformedClips);

        // Load audio tracks from database
        const audioResponse = await authenticatedFetch(`/api/scenes/${sceneId}/audio-tracks`, user);
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          const transformedAudioTracks: AudioTrack[] = audioData.audioTracks.map((track: any) => ({
            id: track.id,
            audioId: track.audioId || '',
            audioUrl: track.audioUrl,
            title: track.title || 'Audio Track',
            startTime: Number.parseFloat(track.startTimeSeconds || '0'),
            duration: Number.parseFloat(track.durationSeconds || '0'),
          }));
          setAudioTracks(transformedAudioTracks);
        }

        // Load assembled video URL if it exists
        if (data.scene.assembledVideoUrl) {
          // Fetch presigned URL for the assembled video
          const assembleStatusResponse = await authenticatedFetch(`/api/scenes/${sceneId}/assemble`, user);
          if (assembleStatusResponse.ok) {
            const assembleData = await assembleStatusResponse.json();
            setAssembledVideoUrl(assembleData.assembledVideoUrl);
          }
        } else {
          setAssembledVideoUrl(null);
        }

        // Check for ongoing processing job
        try {
          const jobResponse = await authenticatedFetch(
            `/api/scenes/${sceneId}/assemble-async`,
            user,
          );

          if (jobResponse.ok) {
            const jobData = await jobResponse.json();

            // If job is pending or processing, enable polling
            if (jobData.status === 'pending' || jobData.status === 'processing') {
              setPollingEnabled(true);
              setIsExporting(true);

              toast.loading(
                'Video assembly in progress...',
                { id: 'processing-toast' },
              );
            }

            // If job failed, show the error
            if (jobData.status === 'failed' && jobData.errorMessage) {
              setLastFailedJob({
                errorMessage: jobData.errorMessage,
                jobId: jobData.jobId,
              });
            }
          }
        } catch (jobError) {
          // No job exists yet, which is fine
          console.log('No ongoing job found');
        }
      }
    } catch (error) {
      console.error('Error loading scene:', error);
    }
  };

  const createNewScene = () => {
    setCurrentSceneId(null);
    setSceneName('Untitled Scene');
    setSceneDescription('');
    setClips([]);
    setAudioTracks([]);
    setLoopAudio(false);
    setFitAudioToDuration(false);
    setAssembledVideoUrl(null);
  };

  const handleAddClip = (media: MediaItem, duration: number) => {
    console.log('handleAddClip called:', { media, duration });

    // Handle audio separately - add to audio tracks
    if (media.type === 'audio') {
      const startTime = audioTracks.reduce((sum, track) => {
        const trackEnd = track.startTime + track.duration;
        return Math.max(sum, trackEnd);
      }, 0);

      const newAudioTrack: AudioTrack = {
        id: `audio-${Date.now()}`,
        audioId: media.id,
        audioUrl: media.mediaUrl || media.thumbnailUrl,
        title: media.title,
        startTime,
        duration: duration || media.duration || 5,
      };

      console.log('New audio track created:', newAudioTrack);
      setAudioTracks([...audioTracks, newAudioTrack]);

      return;
    }

    // Handle video/image clips
    const startTime = clips.reduce((sum, clip) => {
      const clipEnd = clip.startTime + clip.duration;
      return Math.max(sum, clipEnd);
    }, 0);

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: media.type as 'video' | 'image',
      mediaId: media.id,
      title: media.title,
      thumbnailUrl: media.thumbnailUrl,
      startTime,
      duration,
    };

    console.log('New clip created:', newClip);

    const updatedClips = [...clips, newClip];
    console.log('Updated clips array:', updatedClips);
    setClips(updatedClips);

    // Show success toast
    toast.success(`Added "${media.title}" to timeline`);
  };

  const handleSaveScene = async () => {
    if (!selectedPatient) {
      toast.error('Please select a patient first');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving scene...');

    try {
      // Create or update scene
      let sceneId = currentSceneId;

      if (!sceneId) {
        // Create new scene
        const response = await authenticatedPost('/api/scenes', user, {
          patientId: selectedPatient,
          title: sceneName,
          description: sceneDescription,
        });

        if (!response.ok) {
          throw new Error('Failed to create scene');
        }

        const data = await response.json();
        sceneId = data.scene.id;
        setCurrentSceneId(sceneId);
      } else {
        // Update existing scene
        const calculatedDuration = clips.length > 0
          ? Math.max(...clips.map(c => c.startTime + c.duration))
          : 0;

        await authenticatedPut(`/api/scenes/${sceneId}`, user, {
          title: sceneName,
          description: sceneDescription,
          durationSeconds: calculatedDuration.toString(),
          status: 'draft',
          loopAudio,
          fitAudioToDuration,
        });
      }

      // Save clips
      if (sceneId) {
        await authenticatedPut(`/api/scenes/${sceneId}/clips`, user, {
          clips: clips.map((clip, index) => ({
            mediaId: clip.mediaId,
            sequenceNumber: index,
            startTimeSeconds: clip.startTime.toString(),
            endTimeSeconds: (clip.startTime + clip.duration).toString(),
          })),
        });

        // Save audio tracks
        // First delete all existing tracks
        await authenticatedFetch(`/api/scenes/${sceneId}/audio-tracks`, user, {
          method: 'DELETE',
        });

        // Then add new tracks
        for (const track of audioTracks) {
          await authenticatedPost(`/api/scenes/${sceneId}/audio-tracks`, user, {
            audioId: track.audioId,
            audioUrl: track.audioUrl,
            title: track.title,
            startTimeSeconds: track.startTime,
            durationSeconds: track.duration,
            volume: 100, // Default volume
            sequenceNumber: audioTracks.indexOf(track),
          });
        }
      }

      toast.success('Scene saved successfully!', { id: toastId });
      return sceneId;
    } catch (error) {
      console.error('Error saving scene:', error);
      toast.error('Failed to save scene', { id: toastId });
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (!currentSceneId) {
      toast.error('Please save the scene first before exporting');
      return;
    }

    if (clips.length === 0) {
      toast.error('Add clips to the timeline before exporting');
      return;
    }

    // Show confirmation toast
    const proceed = window.confirm(
      `This will assemble ${clips.length} clips into a video. This may take several minutes depending on the scene length. Continue?`,
    );

    if (!proceed) {
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(`Assembling ${clips.length} clips... This may take a few minutes.`);

    try {
      // First, save the scene to ensure clips are up to date
      const savedSceneId = await handleSaveScene();

      if (!savedSceneId) {
        throw new Error('Failed to save scene before exporting');
      }

      // Then trigger async assembly
      toast.loading('Starting video assembly...', { id: toastId });

      const response = await authenticatedPost(`/api/scenes/${savedSceneId}/assemble-async`, user, {
        audioTrack: null, // Optional: add background music
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start assembly');
      }

      const data = await response.json();

      // Check if job was created successfully
      if (data.jobId) {
        setPollingEnabled(true);
        setLastFailedJob(null); // Clear any previous failed job

        toast.success(
          'Video assembly started! Processing in the background...',
          { id: toastId, duration: 3000 },
        );

        // Show processing message with progress updates
        toast.loading(
          'Assembling video... This may take a few minutes.',
          { id: 'processing-toast' },
        );
      } else {
        throw new Error('No job ID returned from server');
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to start export: ${error.message}`, { id: toastId });
      setIsExporting(false);
      setPollingEnabled(false);
    }
    // Note: Don't set isExporting to false here - it will be set by polling callbacks
  };

  const handlePreview = async () => {
    if (!currentSceneId) {
      toast.error('Please save the scene first before previewing');
      return;
    }

    const toastId = toast.loading('Checking scene status...');

    try {
      // Check if scene is assembled
      const response = await authenticatedFetch(`/api/scenes/${currentSceneId}/assemble`, user);

      if (!response.ok) {
        throw new Error('Failed to check assembly status');
      }

      const data = await response.json();

      if (data.isAssembled && data.assembledVideoUrl) {
        toast.success('Opening video preview...', { id: toastId });
        // Open video in modal viewer
        setPreviewVideoUrl(data.assembledVideoUrl);
        setIsViewerOpen(true);
      } else {
        toast.dismiss(toastId);
        const shouldAssemble = window.confirm(
          'This scene has not been assembled yet. Would you like to assemble it now?',
        );

        if (shouldAssemble) {
          await handleExport();
        }
      }
    } catch (error: any) {
      console.error('Preview error:', error);
      toast.error(`Failed to preview scene: ${error.message}`, { id: toastId });
    }
  };

  // Determine if scene is currently being processed
  const isProcessingOrExporting = isProcessing || isExporting;

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        {onBackToLibrary && (
          <div className="mb-4">
            <Button
              variant="ghost"
              onClick={onBackToLibrary}
              disabled={isProcessingOrExporting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Scenes
            </Button>
          </div>
        )}

        {/* Patient & Scene Selector */}
        <div className="mb-4 flex items-center gap-4">
          <div className="max-w-xs flex-1">
            <label className="mb-1 block text-xs font-medium text-gray-700">
              Patient
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => {
                setSelectedPatient(e.target.value);
                createNewScene();
              }}
              disabled={isProcessingOrExporting}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Select patient...</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="max-w-md flex-1">
            <Input
              value={sceneName}
              onChange={e => setSceneName(e.target.value)}
              className="text-2xl font-bold"
              placeholder="Scene name..."
              disabled={!selectedPatient || isProcessingOrExporting}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowInstantPreview(true)}
              disabled={!selectedPatient || clips.length === 0 || isProcessingOrExporting}
            >
              <Play className="mr-2 h-4 w-4" />
              Preview Draft
            </Button>
            <Button
              variant="ghost"
              onClick={handlePreview}
              disabled={!selectedPatient || clips.length === 0 || isProcessingOrExporting}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Final
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={!selectedPatient || clips.length === 0 || isProcessingOrExporting || isSaving}
              className="relative"
            >
              {isExporting || isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {videoJob?.currentStep || 'Processing...'}
                  {videoJob?.progress !== undefined && (
                    <span className="ml-2 text-xs opacity-75">
                      {Math.round(videoJob.progress)}%
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </>
              )}
            </Button>
            <Button
              variant="primary"
              onClick={handleSaveScene}
              disabled={isSaving || clips.length === 0 || !selectedPatient || isProcessingOrExporting}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Scene
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Video Processing Progress */}
        {(isExporting || isProcessing) && videoJob && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <h3 className="text-sm font-semibold text-blue-900">
                  Video Processing
                </h3>
              </div>
              <span className="text-xs font-medium text-blue-700">
                {Math.round(videoJob.progress || 0)}% Complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-blue-200">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${videoJob.progress || 0}%` }}
              />
            </div>

            {/* Current Step */}
            <p className="text-xs text-blue-700">
              {videoJob.currentStep || 'Starting...'}
            </p>

            {/* Job Info */}
            {videoJob.jobId && (
              <p className="mt-1 text-xs text-blue-600">
                Job ID: {videoJob.jobId.substring(0, 12)}...
              </p>
            )}
          </div>
        )}

        {/* Audio Settings */}
        {audioTracks.length > 0 && (
          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <Music className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-indigo-900">
                Audio Settings ({audioTracks.length} track{audioTracks.length !== 1 ? 's' : ''})
              </h3>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={loopAudio}
                  onChange={(e) => setLoopAudio(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={fitAudioToDuration || isProcessingOrExporting}
                />
                <span className="text-sm text-gray-700">
                  Loop audio to fit video length
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={fitAudioToDuration}
                  onChange={(e) => setFitAudioToDuration(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={loopAudio || isProcessingOrExporting}
                />
                <span className="text-sm text-gray-700">
                  Trim/cut audio to fit video length
                </span>
              </label>
            </div>
            <p className="mt-2 text-xs text-indigo-700">
              {loopAudio
                ? 'Audio will repeat with smooth crossfade until video ends'
                : fitAudioToDuration
                  ? 'Audio will be trimmed/cut to match video duration exactly'
                  : 'Audio will play once and stop when it ends'}
            </p>
          </div>
        )}

        {/* Last Export Failed Warning */}
        {lastFailedJob && !isProcessingOrExporting && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-red-900">
                ❌ Last Export Failed
              </h3>
              <button
                onClick={() => setLastFailedJob(null)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Dismiss
              </button>
            </div>
            <p className="text-sm text-red-800">
              {lastFailedJob.errorMessage}
            </p>
            <p className="mt-1 text-xs text-red-600">
              Job ID: {lastFailedJob.jobId.substring(0, 12)}...
            </p>
            <button
              onClick={handleExport}
              className="mt-3 rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
            >
              Retry Export
            </button>
          </div>
        )}

        {/* Duration Warning */}
        {totalDuration > 60 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-800">
              ⚠️ Video duration ({Math.round(totalDuration)}s) exceeds 60-second limit. Export will fail. Please reduce clip durations.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600">
          {selectedPatient
            ? 'Assemble video scenes with images, videos, and audio for your patient\'s story'
            : 'Select a patient to start creating scenes'}
        </p>
      </div>

      {/* Main Content */}
      <div className={`relative grid min-h-0 flex-1 grid-cols-3 gap-6 ${isProcessingOrExporting ? 'pointer-events-none' : ''}`}>
        {/* Processing Overlay */}
        {(isExporting || isProcessing) && (
          <div className="pointer-events-auto absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/20 backdrop-blur-sm">
            <div className="rounded-lg border border-blue-300 bg-white/95 p-6 text-center shadow-xl">
              <Loader2 className="mx-auto mb-3 h-12 w-12 animate-spin text-blue-600" />
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Video Processing in Progress
              </h3>
              <p className="mb-1 text-sm text-gray-600">
                {videoJob?.currentStep || 'Processing...'}
              </p>
              <p className="text-xs text-gray-500">
                Editing is temporarily disabled
              </p>
            </div>
          </div>
        )}

        {/* Clip Library (Left) */}
        <div className="col-span-1 h-full overflow-hidden">
          {selectedPatient
            ? (
                <ClipLibrary
                  onAddToTimeline={handleAddClip}
                  patientId={selectedPatient}
                />
              )
            : (
                <div className="flex h-full items-center justify-center rounded-lg border border-gray-200 bg-white">
                  <p className="text-sm text-gray-500">Select a patient to view media</p>
                </div>
              )}
        </div>

        {/* Timeline & Preview (Right) */}
        <div className="col-span-2 flex h-full flex-col gap-6">
          {/* Preview Area */}
          <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-gray-900">
            {assembledVideoUrl ? (
              // Show assembled video player
              <div className="relative h-full w-full">
                <video
                  src={assembledVideoUrl}
                  controls
                  className="h-full w-full object-contain"
                />
              </div>
            ) : clips.length > 0 && clips[0] ? (
              // Show first clip as preview with "Please export first" overlay
              <div className="relative h-full w-full">
                <img
                  src={clips[0].thumbnailUrl}
                  alt="Scene preview"
                  className="h-full w-full object-cover"
                />
                <div className="bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black">
                  <div className="max-w-xs text-center text-white">
                    <Eye className="mx-auto mb-3 h-12 w-12 opacity-75" />
                    <p className="mb-2 text-sm font-semibold">Please Export</p>
                    <p className="text-xs opacity-90">
                      Click the "Export" button to assemble your scene. After export completes, the preview will refresh automatically.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Show empty state
              <div className="text-center text-gray-400">
                <p className="mb-2">Scene Preview</p>
                <p className="text-sm">Add clips from the library to start building your scene</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="min-h-0 flex-1">
            <SceneTimeline
              clips={clips}
              audioTracks={audioTracks}
              totalDuration={totalDuration}
              onClipsChange={clips => setClips(clips)}
              onAudioTracksChange={setAudioTracks}
              onAddClip={() => {
                // Scroll to clip library or show modal
                console.log('Add clip from library');
              }}
            />
          </div>
        </div>
      </div>

      {/* Instant Preview Player Modal */}
      {showInstantPreview && (
        <ScenePreviewPlayer
          clips={clips}
          audioTracks={audioTracks}
          totalDuration={totalDuration}
          sceneName={sceneName}
          onClose={() => setShowInstantPreview(false)}
        />
      )}

      {/* Final Video Player Modal */}
      {isViewerOpen && previewVideoUrl && (
        <MediaViewer
          item={{
            id: currentSceneId || 'preview',
            type: 'video',
            title: sceneName,
            url: previewVideoUrl,
            patientName: patients.find(p => p.id === selectedPatient)?.name,
            sessionName: undefined,
            createdAt: new Date(),
            duration: totalDuration,
            tags: undefined,
            prompt: sceneDescription || undefined,
          }}
          onClose={() => {
            setIsViewerOpen(false);
            setPreviewVideoUrl(null);
          }}
        />
      )}
    </div>
  );
}
