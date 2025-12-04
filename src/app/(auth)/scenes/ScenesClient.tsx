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

      // Then trigger assembly
      toast.loading('Processing video with FFmpeg...', { id: toastId });

      const response = await authenticatedPost(`/api/scenes/${savedSceneId}/assemble`, user, {
        audioTrack: null, // Optional: add background music
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Assembly failed');
      }

      const data = await response.json();

      toast.success(
        `Scene assembled successfully! Duration: ${Math.round(data.durationSeconds)}s, ${data.clipCount} clips`,
        { id: toastId, duration: 5000 },
      );

      // Update assembled video URL immediately
      if (data.assembledVideoUrl) {
        setAssembledVideoUrl(data.assembledVideoUrl);
      }

      // Refresh scene to get updated URL
      if (savedSceneId) {
        await loadScene(savedSceneId);
      }

      // Auto-display the exported video
      if (data.assembledVideoUrl) {
        setPreviewVideoUrl(data.assembledVideoUrl);
        setIsViewerOpen(true);
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Failed to export scene: ${error.message}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
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

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        {/* Back Button */}
        {onBackToLibrary && (
          <div className="mb-4">
            <Button variant="ghost" onClick={onBackToLibrary}>
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
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
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
              disabled={!selectedPatient}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => setShowInstantPreview(true)}
              disabled={!selectedPatient || clips.length === 0}
            >
              <Play className="mr-2 h-4 w-4" />
              Preview Draft
            </Button>
            <Button
              variant="ghost"
              onClick={handlePreview}
              disabled={!selectedPatient || clips.length === 0 || isExporting}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Final
            </Button>
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={!selectedPatient || clips.length === 0 || isExporting || isSaving}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assembling...
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
              disabled={isSaving || clips.length === 0 || !selectedPatient || isExporting}
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
                  disabled={fitAudioToDuration}
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
                  disabled={loopAudio}
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
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-6">
        {/* Clip Library (Left) */}
        <div className="col-span-1 h-full overflow-hidden">
          {selectedPatient
            ? (
                <ClipLibrary onAddToTimeline={handleAddClip} patientId={selectedPatient} />
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
