'use client';

import type { SceneCardData } from './SceneCard';
import { arrayMove } from '@dnd-kit/sortable';
import { ChevronDown, ChevronUp, Loader2, PlayCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AssetPickerModal } from '@/components/pages/AssetPickerModal';
import { useAuth } from '@/contexts/AuthContext';
import { useVideoJobPolling } from '@/hooks/useVideoJobPolling';
import { getAllImageModelsFlat, getFilteredImageModels, isValidVideoModel } from '@/libs/ModelMetadata';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { generateSceneDescription, generateSceneTitle } from '@/utils/SceneHelpers';
import { CompilationProgressModal } from './CompilationProgressModal';
import { MusicGenerationOptionsModal } from './MusicGenerationOptionsModal';
import { MusicGenerationPanel } from './MusicGenerationPanel';
import { PatientReferenceModal } from './PatientReferenceModal';
import { SceneCardSequence } from './SceneCardSequence';
import { SceneCompilationModal } from './SceneCompilationModal';
import { SceneGenerationTopBar } from './SceneGenerationTopBar';
import { SelectMusicModal } from './SelectMusicModal';

type Patient = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type ReferenceImage = {
  id: string;
  url: string;
  name?: string;
};

type MusicOption = {
  title: string;
  genre_tags?: string[];
  mood?: string;
  music_description?: string;
  style_prompt?: string;
  suggested_lyrics?: string;
};

type SceneGenerationLayoutProps = {
  isOpen: boolean;
  onClose: () => void;
  onBackToLibrary?: () => void; // Navigate back to scenes library
  initialScenes?: SceneCardData[];
  patient?: Patient; // NOW OPTIONAL - will show patient selector if not provided
  sessionId?: string | null; // Session ID to link the scene to a transcript session
  aiMusicOptions?: {
    instrumental?: MusicOption;
    lyrical?: MusicOption;
  };
  mode?: 'create' | 'edit'; // Operation mode
  existingSceneId?: string; // For editing existing scenes
};

export function SceneGenerationLayout({
  isOpen,
  onClose,
  onBackToLibrary: _onBackToLibrary,
  initialScenes = [],
  patient: patientProp,
  sessionId = null,
  aiMusicOptions,
  mode = 'create',
  existingSceneId,
}: SceneGenerationLayoutProps) {
  const { user } = useAuth();

  // Patient state - use prop if provided, otherwise allow selection
  const [patient, setPatient] = useState<Patient | undefined>(patientProp);
  const [availablePatients, setAvailablePatients] = useState<Patient[]>([]);
  // Start with loading=true when no patient prop (we'll need to fetch)
  const [loadingPatients, setLoadingPatients] = useState(!patientProp);

  const [scenes, setScenes] = useState<SceneCardData[]>(initialScenes);
  // Ref to track current scenes for async operations (prevents stale closure issues)
  const scenesRef = useRef<SceneCardData[]>(scenes);
  const [selectedImageModel, setSelectedImageModel] = useState(() => {
    // Load persisted image model from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sceneGeneration_imageModel');
      return saved || 'flux-dev';
    }
    return 'flux-dev';
  });
  const [selectedVideoModel, setSelectedVideoModel] = useState(() => {
    const defaultModel = 'seedance-v1.5-pro-i2v';
    // Load persisted video model from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sceneGeneration_videoModel');
      // Validate saved model - if invalid (e.g., old 'seedance-1-lite'), use default
      if (saved && isValidVideoModel(saved)) {
        return saved;
      }
      // Clear invalid model from localStorage
      if (saved) {
        console.warn(`[SceneGeneration] Invalid saved video model: "${saved}", resetting to default`);
        localStorage.removeItem('sceneGeneration_videoModel');
      }
    }
    return defaultModel;
  });
  const [useReference, setUseReference] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [selectedReferenceImageIds, setSelectedReferenceImageIds] = useState<string[]>([]); // Which reference images to use
  const [isLoadingReferenceImages, setIsLoadingReferenceImages] = useState(false);
  const [showReferenceModal, setShowReferenceModal] = useState(false);
  const [showCompilationModal, setShowCompilationModal] = useState(false);
  const [musicUrl, setMusicUrl] = useState<string>();
  const [musicWaveform, setMusicWaveform] = useState<number[]>();
  const [musicDuration, setMusicDuration] = useState(0);
  const [musicMediaId, setMusicMediaId] = useState<string | null>(null); // Media library ID for music
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [musicGenerationProgress, setMusicGenerationProgress] = useState(0);
  const [musicGenerationStatus, setMusicGenerationStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [currentMusicTaskId, setCurrentMusicTaskId] = useState<string | null>(null);
  const [showMusicOptionsModal, setShowMusicOptionsModal] = useState(false);
  const [showSelectMusicModal, setShowSelectMusicModal] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false); // Track compilation state
  const [generatedMusicOptions, setGeneratedMusicOptions] = useState<{
    instrumental?: MusicOption;
    lyrical?: MusicOption;
  } | null>(null);
  const [isLoadingMusicSuggestions, setIsLoadingMusicSuggestions] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState<string>('');
  const [compilationProgress, setCompilationProgress] = useState({
    status: 'processing' as 'processing' | 'completed' | 'failed',
    step: '',
    progress: 0,
    sceneId: null as string | null,
    errorMessage: '',
  });

  // Compilation settings
  const [loopAudio, setLoopAudio] = useState(true); // Default: always loop music
  const [loopScenes, setLoopScenes] = useState(false); // Default: don't loop scenes
  const [sceneDuration, setSceneDuration] = useState(10); // Default: 10 seconds per scene

  // Processing state for existing scenes being compiled
  const [isSceneProcessing, setIsSceneProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');

  // Completed video URL for playback
  const [completedVideoUrl, setCompletedVideoUrl] = useState<string | null>(null);

  // Video player loading/error states
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showCompiledVideo, setShowCompiledVideo] = useState(true);

  // Asset picker modal state
  const [showAssetPickerModal, setShowAssetPickerModal] = useState(false);
  const [assetPickerSceneId, setAssetPickerSceneId] = useState<string | null>(null);

  // Reset video loading state when video URL changes
  useEffect(() => {
    if (completedVideoUrl) {
      setVideoLoading(true);
      setVideoError(false);
    }
  }, [completedVideoUrl]);

  // Use video job polling hook for compilation progress tracking
  const { job: videoJob, isProcessing: _isJobProcessing } = useVideoJobPolling({
    sceneId: compilationProgress.sceneId || undefined,
    enabled: compilationProgress.status === 'processing' && !!compilationProgress.sceneId,
    pollInterval: 2000,
    onComplete: (_job) => {
      setCompilationProgress(prev => ({
        ...prev,
        status: 'completed',
        step: 'Video assembled successfully!',
        progress: 100,
      }));
      toast.success('Scene compiled and saved successfully!', { id: 'compile' });
      setIsCompiling(false);

      // Auto-close modal after 3 seconds and close the generation modal
      setTimeout(() => {
        setShowProgressModal(false);
        onClose();
      }, 3000);
    },
    onError: (error) => {
      setCompilationProgress(prev => ({
        ...prev,
        status: 'failed',
        errorMessage: error,
      }));
      toast.error(error, { id: 'compile' });
      setIsCompiling(false);
    },
  });

  // Use video job polling hook for EXISTING scenes that are processing (edit mode)
  const { job: existingSceneJob } = useVideoJobPolling({
    sceneId: existingSceneId,
    enabled: isSceneProcessing && !!existingSceneId,
    pollInterval: 3000,
    onComplete: async (completedJob) => {
      setIsSceneProcessing(false);
      setCompletedVideoUrl(completedJob?.assembledVideoUrl || null);
      toast.success('Scene compilation completed!');
      // Refetch scene data to get the video URL
      if (existingSceneId && user) {
        try {
          const jobResponse = await authenticatedFetch(
            `/api/scenes/${existingSceneId}/assemble-async`,
            user,
          );
          if (jobResponse.ok) {
            const jobData = await jobResponse.json();
            if (jobData.assembledVideoUrl) {
              setCompletedVideoUrl(jobData.assembledVideoUrl);
            }
          }
        } catch (error) {
          console.error('[SceneGeneration] Error fetching completed video URL:', error);
        }
      }
    },
    onError: (error) => {
      setIsSceneProcessing(false);
      toast.error(`Scene compilation failed: ${error}`);
    },
  });

  // Update processing progress from existing scene polling
  useEffect(() => {
    if (existingSceneJob && isSceneProcessing) {
      setProcessingProgress(existingSceneJob.progress || 0);
      setProcessingStep(existingSceneJob.currentStep || 'Processing...');

      if (existingSceneJob.status === 'completed') {
        setIsSceneProcessing(false);
        setCompletedVideoUrl(existingSceneJob.assembledVideoUrl || null);
      } else if (existingSceneJob.status === 'failed') {
        setIsSceneProcessing(false);
      }
    }
  }, [existingSceneJob, isSceneProcessing]);

  // Update compilation progress from polling
  useEffect(() => {
    if (videoJob && compilationProgress.status === 'processing') {
      const progress = videoJob.progress || 50;
      const step = videoJob.currentStep || 'Processing';

      // Calculate actual progress (70-95% during assembly)
      const assemblyProgress = Math.min(70 + (progress * 0.25), 95);

      setCompilationProgress(prev => ({
        ...prev,
        step: `Assembling video: ${step}`,
        progress: Math.round(assemblyProgress),
      }));
      toast.loading(`Assembling video: ${step} (${progress}%)`, { id: 'compile' });
    }
  }, [videoJob, compilationProgress.status]);

  // Persist image model selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sceneGeneration_imageModel', selectedImageModel);
    }
  }, [selectedImageModel]);

  // Persist video model selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sceneGeneration_videoModel', selectedVideoModel);
    }
  }, [selectedVideoModel]);

  // Keep scenesRef in sync with state for async operations
  useEffect(() => {
    scenesRef.current = scenes;
  }, [scenes]);

  // Fetch available patients when no patient is provided
  useEffect(() => {
    async function fetchPatients() {
      if (patientProp || !user || !isOpen) return; // Skip if patient provided or modal closed

      setLoadingPatients(true);
      try {
        const response = await authenticatedFetch('/api/patients', user);
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        setAvailablePatients(data.patients || []);
      } catch (error) {
        console.error('[SceneGeneration] Error fetching patients:', error);
        toast.error('Failed to load patients');
        setAvailablePatients([]);
      } finally {
        setLoadingPatients(false);
      }
    }

    fetchPatients();
  }, [isOpen, patientProp, user]);

  // Load existing scene data when in edit mode
  useEffect(() => {
    async function loadExistingScene() {
      if (mode !== 'edit' || !existingSceneId || !user) return;

      try {
        toast.loading('Loading scene...', { id: 'load-scene' });

        // Fetch scene data
        const sceneResponse = await authenticatedFetch(`/api/scenes/${existingSceneId}`, user);
        if (!sceneResponse.ok) {
          throw new Error('Failed to load scene');
        }

        const sceneData = await sceneResponse.json();

        // Set patient from scene data
        if (sceneData.scene.patient) {
          setPatient({
            id: sceneData.scene.patient.id,
            name: sceneData.scene.patient.name,
            avatarUrl: sceneData.scene.patient.avatarUrl,
          });
        }

        // Check if scene is processing
        if (sceneData.scene.status === 'processing') {
          setIsSceneProcessing(true);
          // Fetch latest job status
          try {
            const jobResponse = await authenticatedFetch(
              `/api/scenes/${existingSceneId}/assemble-async`,
              user,
            );
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              setProcessingProgress(jobData.progress || 0);
              setProcessingStep(jobData.currentStep || 'Processing...');
            }
          } catch (error) {
            console.error('[SceneGeneration] Error fetching job status:', error);
          }
        } else if (sceneData.scene.status === 'completed') {
          // Scene is completed, fetch the video URL
          setIsSceneProcessing(false);
          try {
            const jobResponse = await authenticatedFetch(
              `/api/scenes/${existingSceneId}/assemble-async`,
              user,
            );
            if (jobResponse.ok) {
              const jobData = await jobResponse.json();
              if (jobData.assembledVideoUrl) {
                setCompletedVideoUrl(jobData.assembledVideoUrl);
              }
            }
          } catch (error) {
            console.error('[SceneGeneration] Error fetching completed video URL:', error);
          }
        }

        // Fetch clips and convert to SceneCardData format
        const clipsResponse = await authenticatedFetch(`/api/scenes/${existingSceneId}/clips`, user);
        if (clipsResponse.ok) {
          const clipsData = await clipsResponse.json();

          // Convert clips to SceneCardData format
          const sceneCards: SceneCardData[] = clipsData.clips.map((clip: any, index: number) => ({
            id: `scene-${clip.id}`,
            sequence: index + 1,
            title: `Scene ${index + 1}`,
            prompt: clip.generationPrompt || '', // Load prompt from media library
            status: 'ready',
            imageUrl: clip.mediaType === 'image' ? clip.mediaUrl : undefined,
            imageMediaId: clip.mediaType === 'image' ? clip.mediaId : undefined,
            videoUrl: clip.mediaType === 'video' ? clip.mediaUrl : undefined,
            videoMediaId: clip.mediaType === 'video' ? clip.mediaId : undefined,
          }));

          setScenes(sceneCards);
        }

        // Load audio tracks (music)
        const audioResponse = await authenticatedFetch(`/api/scenes/${existingSceneId}/audio-tracks`, user);
        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          if (audioData.audioTracks && audioData.audioTracks.length > 0) {
            const firstAudio = audioData.audioTracks[0];
            setMusicUrl(firstAudio.audioUrl); // Fixed: was trackUrl, should be audioUrl
            setMusicMediaId(firstAudio.audioId);
            setMusicDuration(parseFloat(firstAudio.durationSeconds) || 120);
            setMusicWaveform(Array.from({ length: 100 }, () => Math.random()));
          }
        }

        toast.success('Scene loaded successfully', { id: 'load-scene' });
      } catch (error) {
        console.error('[SceneGeneration] Error loading scene:', error);
        toast.error('Failed to load scene', { id: 'load-scene' });
      }
    }

    loadExistingScene();
  }, [mode, existingSceneId, user]);

  // Always reset to first available model when useReference changes
  useEffect(() => {
    const imageModels = getFilteredImageModels(useReference);
    const allAvailableModels = Object.values(imageModels).flat();

    // Always reset to first model when useReference changes
    if (allAvailableModels.length > 0) {
      const firstModel = allAvailableModels[0];
      if (firstModel && firstModel.value !== selectedImageModel) {
        setSelectedImageModel(firstModel.value);
      }
    }
  }, [useReference]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch patient reference images from API
  useEffect(() => {
    async function fetchPatientImages() {
      if (!patient?.id || !user) return;

      setIsLoadingReferenceImages(true);
      try {
        console.log('[SceneGeneration] Fetching patient reference images for:', patient.id);
        const response = await authenticatedFetch(`/api/patients/${patient.id}`, user);

        if (!response.ok) {
          console.error('[SceneGeneration] Failed to fetch patient:', response.status);
          return;
        }

        const data = await response.json();
        console.log('[SceneGeneration] Patient data received:', {
          hasReferenceImageUrl: !!data.patient?.referenceImageUrl,
          hasAvatarUrl: !!data.patient?.avatarUrl,
        });

        const images: ReferenceImage[] = [];

        // Add reference image if available
        if (data.patient?.referenceImageUrl) {
          images.push({
            id: '1',
            url: data.patient.referenceImageUrl,
            name: 'Reference Image',
          });
        }

        // Add avatar as fallback or additional image
        if (data.patient?.avatarUrl && data.patient.avatarUrl !== data.patient.referenceImageUrl) {
          images.push({
            id: '2',
            url: data.patient.avatarUrl,
            name: 'Avatar',
          });
        }

        console.log('[SceneGeneration] Setting reference images:', images.length);
        setReferenceImages(images);
        // By default, select only the first reference image
        const firstImage = images[0];
        setSelectedReferenceImageIds(firstImage ? [firstImage.id] : []);
      } catch (error) {
        console.error('[SceneGeneration] Error fetching patient images:', error);
        setReferenceImages([]); // Set empty state on error
        setSelectedReferenceImageIds([]);
      } finally {
        setIsLoadingReferenceImages(false);
      }
    }

    if (isOpen && patient?.id && user) {
      fetchPatientImages();
    }
  }, [isOpen, patient?.id, user]);

  // Auto-limit selected reference images when switching to a model with fewer maxReferenceImages
  useEffect(() => {
    const modelMeta = getAllImageModelsFlat().find(m => m.value === selectedImageModel);
    if (modelMeta && modelMeta.maxReferenceImages > 0) {
      // Trim selection if it exceeds model's max
      if (selectedReferenceImageIds.length > modelMeta.maxReferenceImages) {
        setSelectedReferenceImageIds(prev => prev.slice(0, modelMeta.maxReferenceImages));
        toast(`${modelMeta.label} supports ${modelMeta.maxReferenceImages} reference image${modelMeta.maxReferenceImages === 1 ? '' : 's'}. Selection trimmed.`, {
          icon: 'ℹ️',
        });
      }
    }
  }, [selectedImageModel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check if selected image model supports prompts
  const selectedModelMeta = getAllImageModelsFlat().find(m => m.value === selectedImageModel);
  const selectedModelSupportsPrompt = selectedModelMeta?.supportsPrompt ?? true;

  // Poll for music generation task status (every 5 seconds)
  useEffect(() => {
    if (!isOpen || !isGeneratingMusic || !currentMusicTaskId || !user || !patient?.id) {
      return undefined;
    }

    console.log('[Music Polling] Starting polling for task:', currentMusicTaskId);

    const pollInterval = setInterval(async () => {
      try {
        const params = new URLSearchParams({
          patientId: patient.id,
          status: 'pending,processing',
        });

        const response = await authenticatedFetch(`/api/ai/music-tasks?${params.toString()}`, user);

        if (!response.ok) {
          console.error('[Music Polling] Failed to fetch task status');
          return;
        }

        const data = await response.json();
        const task = data.tasks?.find((t: any) => t.taskId === currentMusicTaskId);

        if (!task) {
          console.log('[Music Polling] Task not found in response');
          return;
        }

        console.log('[Music Polling] Task status:', task.status, 'Progress:', task.progress);

        // Update progress and status
        setMusicGenerationProgress(task.progress || 0);
        setMusicGenerationStatus(task.status);

        if (task.status === 'completed' && task.mediaId) {
          // Task completed - fetch media
          clearInterval(pollInterval);

          const mediaResponse = await authenticatedFetch(`/api/media/${task.mediaId}`, user);
          if (!mediaResponse.ok) {
            throw new Error('Failed to fetch music media');
          }

          const mediaData = await mediaResponse.json();

          setMusicUrl(mediaData.media.mediaUrl); // Presigned URL
          setMusicMediaId(task.mediaId); // Store media library ID
          setMusicDuration(task.duration || 120);
          setMusicWaveform(Array.from({ length: 100 }, () => Math.random())); // Mock waveform
          setIsGeneratingMusic(false);
          setCurrentMusicTaskId(null);
          setMusicGenerationProgress(100);
          setMusicGenerationStatus('completed');

          toast.success('Music generated and saved to assets!', { id: 'music' });
        } else if (task.status === 'failed') {
          clearInterval(pollInterval);
          setIsGeneratingMusic(false);
          setCurrentMusicTaskId(null);
          setMusicGenerationStatus('failed');
          toast.error('Music generation failed', { id: 'music' });
        }
      } catch (error) {
        console.error('[Music Polling] Error:', error);
        clearInterval(pollInterval);
        setIsGeneratingMusic(false);
        setCurrentMusicTaskId(null);
        toast.error('Failed to check music status', { id: 'music' });
      }
    }, 5000); // Poll every 5 seconds

    return () => {
      console.log('[Music Polling] Cleaning up interval');
      clearInterval(pollInterval);
    };
  }, [isOpen, isGeneratingMusic, currentMusicTaskId, user, patient?.id]);

  if (!isOpen) return null;

  const handleUpdateScene = (id: string, updates: Partial<SceneCardData>) => {
    setScenes(prev => prev.map(scene =>
      scene.id === id ? { ...scene, ...updates } : scene));
  };

  const handleDeleteScene = (id: string) => {
    setScenes(prev => prev.filter(scene => scene.id !== id));
  };

  const handleAddScene = () => {
    const newSequence = scenes.length + 1;
    const newScene: SceneCardData = {
      id: `scene-${Date.now()}`,
      sequence: newSequence,
      title: `Scene ${newSequence}`,
      prompt: '',
      status: 'draft',
    };
    setScenes(prev => [...prev, newScene]);
    toast.success(`Scene ${newSequence} added`);
  };

  // Handle drag-and-drop reordering of scenes
  const handleReorderScenes = (oldIndex: number, newIndex: number) => {
    setScenes((prev) => {
      const reordered = arrayMove(prev, oldIndex, newIndex);
      // Update sequence numbers after reordering
      return reordered.map((scene, idx) => ({
        ...scene,
        sequence: idx + 1,
      }));
    });
  };

  const handleOptimizePrompt = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !user) return;

    toast.loading('Optimizing prompt...', { id: 'optimize' });

    try {
      // Call AI API to optimize prompt
      const response = await authenticatedFetch(
        '/api/ai/optimize-prompt',
        user,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: scene.prompt,
            optimizeFor: 'image',
            model: 'gpt-4',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to optimize prompt');
      }

      const data = await response.json();

      // Replace prompt with optimized version (not append)
      handleUpdateScene(id, { prompt: data.optimizedPrompt });

      toast.success('Prompt optimized!', { id: 'optimize' });
    }
    catch (error) {
      console.error('Error optimizing prompt:', error);
      toast.error('Failed to optimize prompt', { id: 'optimize' });
    }
  };

  const handleOptimizeMusicPrompt = async () => {
    if (!user) return;

    toast.loading('Optimizing music prompt...', { id: 'optimize-music' });

    try {
      // Call AI API to optimize music prompt
      const response = await authenticatedFetch(
        '/api/ai/optimize-prompt',
        user,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: musicPrompt || 'Calm, therapeutic background music with gentle piano and ambient sounds',
            optimizeFor: 'music',
            model: 'gpt-4',
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Failed to optimize music prompt');
      }

      const data = await response.json();

      // Replace music prompt with optimized version (not append)
      setMusicPrompt(data.optimizedPrompt);

      toast.success('Music prompt optimized!', { id: 'optimize-music' });
    }
    catch (error) {
      console.error('Error optimizing music prompt:', error);
      toast.error('Failed to optimize music prompt', { id: 'optimize-music' });
    }
  };

  const handleGenerateImage = async (id: string) => {
    // Use ref to get latest scenes state, not stale closure
    const scene = scenesRef.current.find(s => s.id === id);
    if (!scene) {
      console.error('[Image Generation] Scene not found:', id);
      return;
    }

    // Capture data immediately before any async operations
    const promptToUse = scene.prompt;
    const titleToUse = scene.title;
    const sequenceToUse = scene.sequence;

    // Log to verify correct prompt is being used for each scene
    console.log('[Image Generation] Scene ID:', id);
    console.log('[Image Generation] Prompt:', promptToUse);

    // Check if this specific scene is already generating
    if (scene.status === 'generating_image') {
      toast.error(`Scene ${sequenceToUse} is already generating an image`);
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate images');
      return;
    }

    if (!patient) {
      toast.error('Please select a patient first');
      return;
    }

    // Check if reference images are still loading when useReference is enabled
    if (useReference && isLoadingReferenceImages) {
      toast.error('Reference images are still loading. Please wait a moment.');
      return;
    }

    // Check if useReference is on but no images available (fetch completed but empty)
    if (useReference && referenceImages.length === 0) {
      toast.error('No reference images available for this patient. Please upload a reference image or disable "Use Reference".');
      return;
    }

    handleUpdateScene(id, { status: 'generating_image' });
    toast.loading(`Generating image for Scene ${sequenceToUse}...`, { id: `image-gen-${id}` });

    try {
      // Prepare reference images array if useReference is enabled
      // Only use SELECTED reference images (filtered by selectedReferenceImageIds)
      const imagesToUse = useReference && referenceImages.length > 0
        ? referenceImages
            .filter(img => selectedReferenceImageIds.includes(img.id))
            .map(img => img.url)
        : undefined;

      console.log('[Image Generation] Request payload:', {
        prompt: promptToUse,
        title: titleToUse,
        model: selectedImageModel,
        patientId: patient.id,
        sessionId,
        referenceImageCount: imagesToUse?.length || 0,
        selectedReferenceImageIds,
      });

      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt: promptToUse,
        title: titleToUse,
        model: selectedImageModel,
        patientId: patient.id,
        sessionId,
        referenceImages: imagesToUse,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Image Generation] API Error:', errorData);
        console.error('[Image Generation] Response status:', response.status);
        throw new Error(errorData.error || 'Image generation failed');
      }

      const data = await response.json();

      handleUpdateScene(id, {
        status: 'draft',
        imageUrl: data.media.mediaUrl,
        imageMediaId: data.media.id,
      });

      toast.success(`Image generated for Scene ${sequenceToUse}!`, { id: `image-gen-${id}` });
    } catch (error) {
      console.error('Image generation error:', error);
      handleUpdateScene(id, { status: 'draft' });
      toast.error(error instanceof Error ? error.message : 'Failed to generate image', { id: `image-gen-${id}` });
    }
  };

  const handleAnimateVideo = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !scene.imageUrl) return;

    if (!user) {
      toast.error('Please sign in to generate videos');
      return;
    }

    if (!patient) {
      toast.error('Please select a patient first');
      return;
    }

    handleUpdateScene(id, { status: 'animating', progress: 0 });
    toast.loading('Animating to video...', { id: `vid-${id}` });

    try {
      // Start async video generation
      const response = await authenticatedPost('/api/ai/generate-video', user, {
        prompt: scene.prompt,
        title: scene.title,
        model: selectedVideoModel, // Use selected video model from TopBar
        referenceImage: scene.imageUrl,
        patientId: patient.id,
        sessionId,
        duration: 5,
        fps: 24,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Video generation failed');
      }

      const data = await response.json();
      const taskId = data.taskId;

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await authenticatedFetch(`/api/ai/video-task/${taskId}`, user);
          if (!statusResponse.ok) {
            clearInterval(pollInterval);
            const errorData = await statusResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to check video status');
          }

          const statusData = await statusResponse.json();
          const taskData = statusData.data || statusData; // Handle both { data: {...} } and flat response

          if (taskData.status === 'completed' && (taskData.media?.id || taskData.mediaId)) {
            clearInterval(pollInterval);

            const mediaId = taskData.media?.id || taskData.mediaId;

            // Fetch media from library
            const mediaResponse = await authenticatedFetch(`/api/media/${mediaId}`, user);
            if (!mediaResponse.ok) {
              throw new Error('Failed to fetch video media');
            }

            const mediaData = await mediaResponse.json();

            handleUpdateScene(id, {
              status: 'ready',
              videoUrl: mediaData.media.mediaUrl,
              videoMediaId: mediaId, // Store media library ID
              progress: 100,
            });

            toast.success('Video ready and saved to assets!', { id: `vid-${id}` });
          } else if (taskData.status === 'failed') {
            clearInterval(pollInterval);
            handleUpdateScene(id, { status: 'draft', progress: 0 });
            toast.error(taskData.error || 'Video generation failed', { id: `vid-${id}` });
          } else {
            // Update progress
            handleUpdateScene(id, { progress: taskData.progress || 50 });
          }
        } catch (pollError) {
          clearInterval(pollInterval);
          console.error('Polling error:', pollError);
          handleUpdateScene(id, { status: 'draft', progress: 0 });
          toast.error('Failed to check video status', { id: `vid-${id}` });
        }
      }, 2000); // Poll every 2 seconds
    } catch (error) {
      console.error('Video animation error:', error);
      handleUpdateScene(id, { status: 'draft', progress: 0 });
      toast.error(error instanceof Error ? error.message : 'Failed to start video generation', { id: `vid-${id}` });
    }
  };

  // Open music generation options modal with AI-suggested options based on scenes
  const handleGenerateMusic = async () => {
    // If we have scene prompts and no existing AI options, generate suggestions
    const scenePrompts = scenes
      .filter(s => s.prompt && s.prompt.trim() !== '')
      .map(s => s.prompt);

    if (scenePrompts.length > 0 && !aiMusicOptions && !generatedMusicOptions && user && patient) {
      setIsLoadingMusicSuggestions(true);
      toast.loading('Generating music suggestions based on your scenes...', { id: 'music-suggestions' });

      try {
        const response = await authenticatedPost('/api/ai/suggest-music-options', user, {
          scenePrompts,
          patientName: patient.name,
        });

        if (response.ok) {
          const data = await response.json();
          setGeneratedMusicOptions(data.options);
          toast.success('Music suggestions ready!', { id: 'music-suggestions' });
        } else {
          console.error('Failed to generate music suggestions');
          toast.dismiss('music-suggestions');
        }
      } catch (error) {
        console.error('Error generating music suggestions:', error);
        toast.dismiss('music-suggestions');
      } finally {
        setIsLoadingMusicSuggestions(false);
      }
    }

    setShowMusicOptionsModal(true);
  };

  // Actually generate music after options are selected
  const handleGenerateMusicWithOptions = async (params: {
    prompt: string;
    title: string;
    instrumental: boolean;
    duration: number;
  }) => {
    if (!user) {
      toast.error('Please sign in to generate music');
      return;
    }

    if (!patient) {
      toast.error('Please select a patient first');
      return;
    }

    setIsGeneratingMusic(true);
    setMusicGenerationProgress(0);
    setMusicGenerationStatus('pending');
    setMusicPrompt(params.prompt); // Store prompt in state so textarea displays it
    toast.loading('Generating music with Suno AI...', { id: 'music' });

    try {
      // Create music generation task
      const response = await authenticatedPost('/api/ai/music-tasks', user, {
        patientId: patient.id,
        sessionId,
        prompt: params.prompt,
        title: params.title,
        style: 'therapeutic ambient',
        model: 'V4_5',
        customMode: false,
        instrumental: params.instrumental,
        duration: params.duration,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start music generation');
      }

      const data = await response.json();
      setCurrentMusicTaskId(data.task.taskId);

      console.log('[Music Generation] Task created:', data.task.taskId);
      toast.success('Music generation started!', { id: 'music' });
    } catch (error) {
      console.error('Music generation error:', error);
      setIsGeneratingMusic(false);
      setCurrentMusicTaskId(null);
      toast.error(error instanceof Error ? error.message : 'Failed to generate music', { id: 'music' });
    }
  };

  // Choose music from library
  const handleChooseFromLibrary = () => {
    setShowSelectMusicModal(true);
  };

  // Handle music selection from library
  const handleSelectMusic = (music: any) => {
    setMusicUrl(music.mediaUrl);
    setMusicMediaId(music.id);
    setMusicDuration(music.durationSeconds || 120);
    setMusicWaveform(Array.from({ length: 100 }, () => Math.random())); // Mock waveform
  };

  const handleRegenerateMusic = async () => {
    setShowMusicOptionsModal(true);
  };

  const handleDownloadMusic = () => {
    if (musicUrl) {
      window.open(musicUrl, '_blank');
    }
  };

  const handleRemoveMusic = () => {
    setMusicUrl(undefined);
    setMusicMediaId(null);
    setMusicWaveform(undefined);
    setMusicDuration(0);
    toast.success('Music removed');
  };

  const handleCompile = () => {
    if (scenes.length === 0) {
      toast.error('Add at least one scene to compile');
      return;
    }

    const scenesWithContent = scenes.filter(s => s.imageUrl || s.videoUrl);
    if (scenesWithContent.length === 0) {
      toast.error('Generate images or videos for your scenes first');
      return;
    }

    if (!musicUrl) {
      toast.error('Generate background music before compiling');
      return;
    }

    setShowCompilationModal(true);
  };

  const handleCompileNow = async () => {
    setShowCompilationModal(false);
    setIsCompiling(true);

    // Show progress modal
    setShowProgressModal(true);
    setCompilationProgress({
      status: 'processing',
      step: 'Initializing...',
      progress: 0,
      sceneId: null,
      errorMessage: '',
    });

    if (!user) {
      toast.error('Please sign in to compile scenes');
      setIsCompiling(false);
      setShowProgressModal(false);
      return;
    }

    if (!patient) {
      toast.error('Please select a patient first');
      setIsCompiling(false);
      setShowProgressModal(false);
      return;
    }

    try {
      // Step 1: Create scene record
      setCompilationProgress(prev => ({
        ...prev,
        step: 'Creating scene... (Step 1/4)',
        progress: 10,
      }));
      toast.loading('Creating scene...', { id: 'compile' });
      const title = generateSceneTitle(scenes, patient.name);
      const description = generateSceneDescription(scenes);

      const createSceneResponse = await authenticatedPost('/api/scenes', user, {
        patientId: patient.id,
        sessionId: sessionId || undefined,
        title,
        description,
        loopAudio, // Loop background music to fit video length
        loopScenes, // Loop scenes to fit music length
      });

      if (!createSceneResponse.ok) {
        const errorData = await createSceneResponse.json();
        throw new Error(errorData.error || 'Failed to create scene');
      }

      const { scene: newScene } = await createSceneResponse.json();
      console.log('[Scene Compilation] Scene created:', newScene.id);

      // Note: Don't set sceneId here - wait until after the job is created
      // to avoid triggering polling before the job exists
      setCompilationProgress(prev => ({
        ...prev,
        progress: 25,
      }));

      // Step 2: Add scene clips
      setCompilationProgress(prev => ({
        ...prev,
        step: 'Adding scene clips... (Step 2/4)',
        progress: 30,
      }));
      toast.loading('Adding scene clips...', { id: 'compile' });

      // Add scene clips for each scene with media
      const scenesWithMedia = scenes.filter(s => s.videoMediaId || s.imageMediaId);

      // Calculate if we need to loop scenes
      const totalBaseDuration = scenesWithMedia.length * sceneDuration;
      const musicDurationSec = musicDuration || 0;
      const needsLooping = loopScenes && musicDurationSec > totalBaseDuration;
      const loopCount = needsLooping
        ? Math.ceil(musicDurationSec / totalBaseDuration)
        : 1;

      console.log(`[Scene Compilation] Loop settings:`, {
        loopScenes,
        musicDuration: musicDurationSec,
        totalBaseDuration,
        needsLooping,
        loopCount,
      });

      // Build clips array (with looping if needed)
      let clipIndex = 0;
      for (let loop = 0; loop < loopCount; loop++) {
        for (let i = 0; i < scenesWithMedia.length; i++) {
          const scene = scenesWithMedia[i];
          if (!scene) continue;

          const mediaId = scene.videoMediaId || scene.imageMediaId; // Prefer video over image
          if (!mediaId) continue;

          const clipResponse = await authenticatedPost(
            `/api/scenes/${newScene.id}/clips`,
            user,
            {
              mediaId,
              sequenceNumber: clipIndex,
              startTimeSeconds: 0,
              endTimeSeconds: sceneDuration, // Use selected duration (5/10/15/20 seconds)
            },
          );

          if (!clipResponse.ok) {
            console.error(`Failed to add clip ${clipIndex}:`, await clipResponse.text());
          } else {
            console.log(`[Scene Compilation] Added clip ${clipIndex + 1}/${scenesWithMedia.length * loopCount} (loop ${loop + 1}/${loopCount})`);
          }

          clipIndex++;
        }
      }

      // Step 3: Add music
      setCompilationProgress(prev => ({
        ...prev,
        step: 'Adding background music... (Step 3/4)',
        progress: 55,
      }));
      toast.loading('Adding background music...', { id: 'compile' });

      // Add music as audio track
      if (musicUrl && musicMediaId) {
        const audioTrackResponse = await authenticatedPost(
          `/api/scenes/${newScene.id}/audio-tracks`,
          user,
          {
            audioId: musicMediaId,
            audioUrl: musicUrl,
            title: 'Background Music',
            startTimeSeconds: 0,
            durationSeconds: musicDuration,
            volume: 100,
            sequenceNumber: 0,
          },
        );

        if (!audioTrackResponse.ok) {
          console.error('Failed to add audio track:', await audioTrackResponse.text());
        } else {
          console.log('[Scene Compilation] Audio track added');
        }
      }

      // Step 4: Trigger assembly
      setCompilationProgress(prev => ({
        ...prev,
        step: 'Starting video assembly... (Step 4/4)',
        progress: 70,
      }));
      toast.loading('Starting video assembly...', { id: 'compile' });

      // Trigger async assembly
      const assembleResponse = await authenticatedPost(
        `/api/scenes/${newScene.id}/assemble-async`,
        user,
        {},
      );

      if (!assembleResponse.ok) {
        const errorData = await assembleResponse.json();
        throw new Error(errorData.error || 'Failed to start video assembly');
      }

      const assembleData = await assembleResponse.json();
      console.log('[Scene Compilation] Assembly started, jobId:', assembleData.jobId);

      // Step 5: Start polling with useVideoJobPolling hook
      // The hook will automatically start polling once sceneId is set and status is 'processing'
      setCompilationProgress(prev => ({
        ...prev,
        sceneId: newScene.id,
        progress: 70,
      }));
    } catch (error) {
      console.error('Scene compilation error:', error);
      setIsCompiling(false);
      setCompilationProgress(prev => ({
        ...prev,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Failed to compile scene',
      }));
      toast.error(
        error instanceof Error ? error.message : 'Failed to compile scene',
        { id: 'compile' },
      );
    }
  };

  const handleAddReferenceImage = (file: File) => {
    // TODO: Upload image
    const newImage: ReferenceImage = {
      id: Date.now().toString(),
      url: URL.createObjectURL(file),
      name: file.name,
    };
    setReferenceImages([...referenceImages, newImage]);
    toast.success('Reference image added');
  };

  const handleRemoveReferenceImage = (imageId: string) => {
    setReferenceImages(referenceImages.filter(img => img.id !== imageId));
    toast.success('Reference image removed');
  };

  // Handle uploading a custom image to a scene
  const handleUploadImage = async (sceneId: string, file: File) => {
    if (!user || !patient?.id) return;

    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    handleUpdateScene(sceneId, { status: 'generating_image' });
    toast.loading('Uploading image...', { id: `upload-${sceneId}` });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patient.id);
      formData.append('title', scene.title || 'Scene Image');
      formData.append('mediaType', 'image');
      if (sessionId) {
        formData.append('sessionId', sessionId);
      }

      const token = await user.getIdToken();
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();

      handleUpdateScene(sceneId, {
        status: 'draft',
        imageUrl: data.media.mediaUrl,
        imageMediaId: data.media.id,
      });

      toast.success('Image uploaded successfully!', { id: `upload-${sceneId}` });
    } catch (error) {
      console.error('Image upload error:', error);
      handleUpdateScene(sceneId, { status: 'draft' });
      toast.error(error instanceof Error ? error.message : 'Failed to upload image', { id: `upload-${sceneId}` });
    }
  };

  // Handle browsing assets for a scene
  const handleBrowseAssets = (sceneId: string) => {
    setAssetPickerSceneId(sceneId);
    setShowAssetPickerModal(true);
  };

  // Handle selecting an asset from the picker
  const handleAssetSelected = (asset: { type: string; data: any }) => {
    if (!assetPickerSceneId || asset.type !== 'media') return;

    const mediaAsset = asset.data;
    if (mediaAsset.mediaType === 'image') {
      handleUpdateScene(assetPickerSceneId, {
        status: 'draft',
        imageUrl: mediaAsset.mediaUrl,
        imageMediaId: mediaAsset.id,
      });
      toast.success('Image selected from assets');
    } else if (mediaAsset.mediaType === 'video') {
      handleUpdateScene(assetPickerSceneId, {
        status: 'ready',
        videoUrl: mediaAsset.mediaUrl,
        videoMediaId: mediaAsset.id,
      });
      toast.success('Video selected from assets');
    }

    setShowAssetPickerModal(false);
    setAssetPickerSceneId(null);
  };

  // Check if any scene is actively generating (locks settings only during generation)
  const isGeneratingAnyImage = scenes.some(s =>
    s.status === 'generating_image' || s.status === 'animating',
  );
  console.log('[Settings Lock Debug] isGeneratingAnyImage:', isGeneratingAnyImage);
  console.log('[Settings Lock Debug] scenes statuses:', scenes.map(s => ({ id: s.id, status: s.status })));

  return (
    <>
      {/* Full-Screen Modal Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" />

      {/* Full-Screen Modal */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Processing Overlay - shown when scene is being compiled */}
        {isSceneProcessing && (
          <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="mx-4 w-full max-w-md rounded-xl bg-white p-8 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
                <h3 className="text-lg font-semibold">Scene Processing</h3>
              </div>

              {/* Progress bar */}
              <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>

              {/* Status text */}
              <p className="mb-4 text-sm text-gray-600">
                {processingStep || 'Processing...'}
                {' '}
                •
                {Math.round(processingProgress)}
                %
              </p>

              <p className="text-center text-xs text-gray-500">
                Please wait while your scene is being compiled.
                This page will update automatically when complete.
              </p>
            </div>
          </div>
        )}

        {/* Top Bar */}
        <SceneGenerationTopBar
          patientName={patient?.name || 'Select Patient'}
          patientAvatarUrl={patient?.avatarUrl}
          patients={availablePatients}
          selectedPatientId={patient?.id}
          onPatientChange={(patientId) => {
            const selectedPatient = availablePatients.find(p => p.id === patientId);
            setPatient(selectedPatient);
          }}
          loadingPatients={loadingPatients}
          selectedImageModel={selectedImageModel}
          onImageModelChange={setSelectedImageModel}
          selectedVideoModel={selectedVideoModel}
          onVideoModelChange={setSelectedVideoModel}
          useReference={useReference}
          onUseReferenceChange={setUseReference}
          onShowReferenceModal={() => setShowReferenceModal(true)}
          referenceImages={referenceImages}
          selectedReferenceImageIds={selectedReferenceImageIds}
          onReferenceImageSelectionChange={setSelectedReferenceImageIds}
          settingsLocked={isGeneratingAnyImage}
        />

        {/* Main Content Area */}
        <div className={`flex flex-1 flex-col overflow-y-auto p-8 ${isSceneProcessing ? 'pointer-events-none opacity-50' : ''}`}>
          {/* Scene Cards */}
          <div className="mb-8">
            <SceneCardSequence
              scenes={scenes}
              onUpdateScene={handleUpdateScene}
              onDeleteScene={handleDeleteScene}
              onOptimizePrompt={handleOptimizePrompt}
              onGenerateImage={handleGenerateImage}
              onUploadImage={handleUploadImage}
              onBrowseAssets={handleBrowseAssets}
              onAnimateVideo={handleAnimateVideo}
              onAddScene={handleAddScene}
              onReorderScenes={handleReorderScenes}
              maxScenes={10}
              supportsPrompt={selectedModelSupportsPrompt}
            />
          </div>

          {/* Music Generation Panel */}
          <div className="mb-8">
            <MusicGenerationPanel
              audioUrl={musicUrl}
              waveformData={musicWaveform}
              duration={musicDuration}
              isGenerating={isGeneratingMusic}
              isLoadingSuggestions={isLoadingMusicSuggestions}
              generationProgress={musicGenerationProgress}
              generationStatus={musicGenerationStatus}
              musicPrompt={musicPrompt}
              onGenerate={handleGenerateMusic}
              onChooseFromLibrary={handleChooseFromLibrary}
              onRegenerate={handleRegenerateMusic}
              onDownload={handleDownloadMusic}
              onRemove={handleRemoveMusic}
              onOptimizePrompt={handleOptimizeMusicPrompt}
              onPromptChange={setMusicPrompt}
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="border-t border-gray-200 bg-white px-8 py-4">
          {/* Compiled Video Player - shown when scene is completed */}
          {completedVideoUrl && (
            <div className="mx-auto mb-4 max-w-4xl overflow-hidden rounded-xl border border-gray-200">
              <button
                type="button"
                onClick={() => setShowCompiledVideo(!showCompiledVideo)}
                className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 transition-colors hover:bg-gray-100"
              >
                <PlayCircle className="h-4 w-4 text-green-600" />
                <h3 className="text-sm font-medium text-gray-700">Compiled Video</h3>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  Ready to view
                </span>
                <span className="ml-auto">
                  {showCompiledVideo ? (
                    <ChevronUp className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  )}
                </span>
              </button>
              {showCompiledVideo && (
                <div className="relative h-80 bg-black">
                  {videoLoading && !videoError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  )}
                  {videoError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                      <p className="mb-2 text-sm">Failed to load video</p>
                      <button
                        type="button"
                        onClick={() => {
                          setVideoError(false);
                          setVideoLoading(true);
                        }}
                        className="rounded bg-white/20 px-3 py-1 text-xs hover:bg-white/30"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <video
                      key={completedVideoUrl}
                      src={completedVideoUrl}
                      controls
                      controlsList="nodownload"
                      preload="metadata"
                      className="h-full w-full object-contain"
                      playsInline
                      onLoadedData={() => setVideoLoading(false)}
                      onError={(e) => {
                        console.error('[Video Player] Error loading video:', e);
                        setVideoError(true);
                        setVideoLoading(false);
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            {/* Back Button - Gray outline style */}
            <button
              onClick={onClose}
              disabled={isCompiling}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>

            {/* Compile Button - Purple filled style */}
            <button
              onClick={handleCompile}
              disabled={!patient || !musicUrl || isCompiling || isGeneratingAnyImage || isGeneratingMusic}
              title={
                !patient
                  ? 'Select a patient first'
                  : !musicUrl
                      ? 'Generate background music first'
                      : isGeneratingAnyImage
                        ? 'Wait for images/videos to finish generating'
                        : isGeneratingMusic
                          ? 'Wait for music to finish generating'
                          : 'Compile scenes into video'
              }
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isCompiling ? 'Compiling...' : 'Compile'}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PatientReferenceModal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        patientName={patient?.name || 'Patient'}
        referenceImages={referenceImages}
        onToggleReference={setUseReference}
        useReference={useReference}
        onAddImage={handleAddReferenceImage}
        onRemoveImage={handleRemoveReferenceImage}
      />

      <SceneCompilationModal
        isOpen={showCompilationModal}
        onClose={() => setShowCompilationModal(false)}
        onCompileNow={handleCompileNow}
        sceneCount={scenes.filter(s => s.imageUrl || s.videoUrl).length}
        isCompiling={isCompiling}
        loopAudio={loopAudio}
        onLoopAudioChange={setLoopAudio}
        loopScenes={loopScenes}
        onLoopScenesChange={setLoopScenes}
        sceneDuration={sceneDuration}
        onSceneDurationChange={setSceneDuration}
        musicDuration={musicDuration}
      />

      <CompilationProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        status={compilationProgress.status}
        currentStep={compilationProgress.step}
        progress={compilationProgress.progress}
        sceneId={compilationProgress.sceneId}
        errorMessage={compilationProgress.errorMessage}
      />

      <MusicGenerationOptionsModal
        isOpen={showMusicOptionsModal}
        onClose={() => setShowMusicOptionsModal(false)}
        onGenerate={handleGenerateMusicWithOptions}
        instrumentalOption={aiMusicOptions?.instrumental || generatedMusicOptions?.instrumental || {
          title: 'Therapeutic Instrumental Music',
          genre_tags: ['ambient', 'therapeutic', 'calming'],
          mood: 'Peaceful and calming',
          music_description: 'Gentle background music designed to create a therapeutic atmosphere with soft instrumentation and ambient sounds',
          style_prompt: 'calm therapeutic background music with gentle piano and ambient sounds',
        }}
        lyricalOption={aiMusicOptions?.lyrical || generatedMusicOptions?.lyrical || {
          title: 'Therapeutic Song with Lyrics',
          genre_tags: ['therapeutic', 'healing', 'narrative'],
          mood: 'Hopeful and encouraging',
          music_description: 'A therapeutic song with meaningful lyrics that support the narrative journey',
          style_prompt: 'therapeutic song with meaningful lyrics about healing and growth',
          suggested_lyrics: 'Gentle verses about hope, healing, and personal growth that complement the therapeutic narrative',
        }}
        hasAiSuggestions={!!(aiMusicOptions?.instrumental || aiMusicOptions?.lyrical || generatedMusicOptions?.instrumental || generatedMusicOptions?.lyrical)}
        isLoadingSuggestions={isLoadingMusicSuggestions}
      />

      <SelectMusicModal
        isOpen={showSelectMusicModal}
        onClose={() => setShowSelectMusicModal(false)}
        onSelect={handleSelectMusic}
        patientId={patient?.id || ''}
        sessionId={sessionId}
        user={user}
      />

      <AssetPickerModal
        isOpen={showAssetPickerModal}
        onClose={() => {
          setShowAssetPickerModal(false);
          setAssetPickerSceneId(null);
        }}
        onSelect={handleAssetSelected}
        patientId={patient?.id}
        mediaOnly
      />
    </>
  );
}
