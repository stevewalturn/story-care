'use client';

import { Download, Eye, Loader2, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ClipLibrary } from '@/components/scenes/ClipLibrary';
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

type MediaItem = {
  id: string;
  type: 'video' | 'image' | 'audio';
  title: string;
  thumbnailUrl: string;
  duration?: number;
};

export function ScenesClient() {
  const { user } = useAuth();
  const [sceneName, setSceneName] = useState('Untitled Scene');
  const [sceneDescription, setSceneDescription] = useState('');
  const [clips, setClips] = useState<Clip[]>([]);
  const [totalDuration, setTotalDuration] = useState(60); // 60 seconds default
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentSceneId, setCurrentSceneId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [patients, setPatients] = useState<any[]>([]);
  const [scenes, setScenes] = useState<any[]>([]);
  const [isLoadingScenes, setIsLoadingScenes] = useState(false);

  // Load patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Load scenes when patient changes
  useEffect(() => {
    if (selectedPatient) {
      fetchScenes();
    }
  }, [selectedPatient]);

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

  const fetchScenes = async () => {
    try {
      setIsLoadingScenes(true);
      const response = await authenticatedFetch(`/api/scenes?patientId=${selectedPatient}`, user);
      if (response.ok) {
        const data = await response.json();
        setScenes(data.scenes || []);
      }
    } catch (error) {
      console.error('Error fetching scenes:', error);
    } finally {
      setIsLoadingScenes(false);
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

        // Transform clips from API format
        const transformedClips: Clip[] = data.clips.map((clip: any) => ({
          id: clip.id,
          type: 'image', // Will be determined from media
          mediaId: clip.mediaId,
          title: `Clip ${clip.sequenceNumber}`,
          thumbnailUrl: '', // Will be loaded from media
          startTime: Number.parseFloat(clip.startTimeSeconds),
          duration: Number.parseFloat(clip.endTimeSeconds) - Number.parseFloat(clip.startTimeSeconds),
        }));

        setClips(transformedClips);

        if (transformedClips.length > 0) {
          const maxEnd = Math.max(...transformedClips.map(c => c.startTime + c.duration));
          setTotalDuration(Math.ceil(maxEnd / 10) * 10);
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
    setTotalDuration(60);
  };

  const handleAddClip = (media: MediaItem, duration: number) => {
    console.log('handleAddClip called:', { media, duration });

    // Calculate start time (end of last clip)
    const startTime = clips.reduce((sum, clip) => {
      const clipEnd = clip.startTime + clip.duration;
      return Math.max(sum, clipEnd);
    }, 0);

    const newClip: Clip = {
      id: `clip-${Date.now()}`,
      type: media.type === 'audio' ? 'image' : media.type,
      mediaId: media.id,
      title: media.title,
      thumbnailUrl: media.thumbnailUrl,
      startTime,
      duration,
      audioTrack: media.type === 'audio' ? media.title : undefined,
    };

    console.log('New clip created:', newClip);

    const updatedClips = [...clips, newClip];
    console.log('Updated clips array:', updatedClips);
    setClips(updatedClips);

    // Adjust total duration if needed
    const sceneEnd = startTime + duration;
    if (sceneEnd > totalDuration) {
      setTotalDuration(Math.ceil(sceneEnd / 10) * 10); // Round up to nearest 10s
    }

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
          createdByTherapistId: user?.uid || 'temp-therapist-id',
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
        });
      }

      // Save clips
      if (sceneId) {
        await authenticatedPut(`/api/scenes/${sceneId}/clips`, user, {
          clips: clips.map((clip, index) => ({
            id: clip.id,
            sequenceNumber: index,
            startTimeSeconds: clip.startTime.toString(),
            endTimeSeconds: (clip.startTime + clip.duration).toString(),
          })),
        });
      }

      toast.success('Scene saved successfully!', { id: toastId });
      fetchScenes(); // Refresh scenes list
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

      // Refresh scene to get updated URL
      if (savedSceneId) {
        await loadScene(savedSceneId);
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
        // Open video in new tab
        window.open(data.assembledVideoUrl, '_blank');
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

          {selectedPatient && (
            <>
              <div className="max-w-xs flex-1">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Scene
                </label>
                <select
                  value={currentSceneId || ''}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      createNewScene();
                    } else if (e.target.value) {
                      loadScene(e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  disabled={isLoadingScenes}
                >
                  <option value="">New scene</option>
                  {scenes.map(scene => (
                    <option key={scene.id} value={scene.id}>
                      {scene.title}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="secondary"
                onClick={createNewScene}
                className="mt-5"
              >
                New Scene
              </Button>
            </>
          )}
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
              onClick={handlePreview}
              disabled={!selectedPatient || clips.length === 0 || isExporting}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
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
            {clips.length > 0 && clips[0] ? (
              <div className="relative h-full w-full">
                {/* Show first clip as preview */}
                <img
                  src={clips[0].thumbnailUrl}
                  alt="Scene preview"
                  className="h-full w-full object-cover"
                />
                <div className="bg-opacity-40 absolute inset-0 flex items-center justify-center bg-black">
                  <div className="text-center text-white">
                    <Eye className="mx-auto mb-3 h-12 w-12 opacity-75" />
                    <p className="text-sm">Click Preview to watch assembled scene</p>
                  </div>
                </div>
              </div>
            ) : (
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
              totalDuration={totalDuration}
              onClipsChange={setClips}
              onAddClip={() => {
                // Scroll to clip library or show modal
                console.log('Add clip from library');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
