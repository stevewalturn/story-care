'use client';

import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { generateSceneDescription, generateSceneTitle } from '@/utils/SceneHelpers';
import { MusicGenerationOptionsModal } from './MusicGenerationOptionsModal';
import { MusicGenerationPanel } from './MusicGenerationPanel';
import { PatientReferenceModal } from './PatientReferenceModal';
import type { SceneCardData } from './SceneCard';
import { SceneCardSequence } from './SceneCardSequence';
import { SceneCompilationModal } from './SceneCompilationModal';
import { SceneGenerationTopBar } from './SceneGenerationTopBar';
import { SelectMusicModal } from './SelectMusicModal';
import { CompilationProgressModal } from './CompilationProgressModal';

interface Patient {
  id: string;
  name: string;
  avatarUrl?: string;
}

interface AIModel {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google';
}

interface ReferenceImage {
  id: string;
  url: string;
  name?: string;
}

interface SceneGenerationLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  initialScenes?: SceneCardData[];
  patient: Patient;
  sessionId?: string | null; // Session ID to link the scene to a transcript session
}

// Mock AI models
const AI_MODELS: AIModel[] = [
  { id: 'gpt-4-1', name: 'GPT-4.1', provider: 'OpenAI' },
  { id: 'gpt-4-1-mini', name: 'GPT-4.1 Mini', provider: 'OpenAI' },
  { id: 'gpt-4-1-nano', name: 'GPT-4.1 Nano', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-35-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-haiku-4', name: 'Claude Haiku 4', provider: 'Anthropic' },
  { id: 'claude-37-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic' },
];

export function SceneGenerationLayout({
  isOpen,
  onClose,
  initialScenes = [],
  patient,
  sessionId = null,
}: SceneGenerationLayoutProps) {
  const { user } = useAuth();
  const [scenes, setScenes] = useState<SceneCardData[]>(initialScenes);
  const [selectedModel, setSelectedModel] = useState('gpt-4-1');
  const [isGeneratingAnyImage, setIsGeneratingAnyImage] = useState(false);
  const [selectedImageModel, setSelectedImageModel] = useState(() => {
    // Load persisted image model from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sceneGeneration_imageModel');
      return saved || 'flux-dev';
    }
    return 'flux-dev';
  });
  const [useReference, setUseReference] = useState(true);
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
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
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState({
    status: 'processing' as 'processing' | 'completed' | 'failed',
    step: '',
    progress: 0,
    sceneId: null as string | null,
    errorMessage: '',
  });

  // Persist image model selection to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sceneGeneration_imageModel', selectedImageModel);
    }
  }, [selectedImageModel]);

  // Fetch patient reference images from API
  useEffect(() => {
    async function fetchPatientImages() {
      if (!patient?.id || !user) return;

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
      } catch (error) {
        console.error('[SceneGeneration] Error fetching patient images:', error);
        setReferenceImages([]); // Set empty state on error
      }
    }

    if (isOpen && patient?.id && user) {
      fetchPatientImages();
    }
  }, [isOpen, patient?.id, user]);

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
    setScenes(scenes.map(scene =>
      scene.id === id ? { ...scene, ...updates } : scene));
  };

  const handleDeleteScene = (id: string) => {
    setScenes(scenes.filter(scene => scene.id !== id));
  };

  const handleOptimizePrompt = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;

    toast.loading('Optimizing prompt...', { id: 'optimize' });

    // TODO: Call API to optimize prompt
    await new Promise(resolve => setTimeout(resolve, 1500));

    const optimizedPrompt = `${scene.prompt} [Enhanced with cinematic lighting, depth of field, and emotional resonance]`;

    handleUpdateScene(id, { prompt: optimizedPrompt });
    toast.success('Prompt optimized!', { id: 'optimize' });
  };

  const handleGenerateImage = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene) return;

    // Check for concurrent image generation
    if (isGeneratingAnyImage) {
      toast.error('Please wait for the current image to finish generating');
      return;
    }

    if (!user) {
      toast.error('Please sign in to generate images');
      return;
    }

    // Set global lock
    setIsGeneratingAnyImage(true);

    // Debug logging
    console.log('[Debug] User object exists:', !!user);
    console.log('[Debug] User email:', user.email);
    console.log('[Debug] User email verified:', user.emailVerified);
    console.log('[Debug] Selected image model:', selectedImageModel);
    console.log('[Debug] Use reference:', useReference);
    console.log('[Debug] Reference images:', referenceImages.length);
    try {
      const token = await user.getIdToken();
      console.log('[Debug] Token obtained:', !!token);
    } catch (tokenError) {
      console.error('[Debug] Token error:', tokenError);
    }

    handleUpdateScene(id, { status: 'generating_image' });
    toast.loading(`Generating image for Scene ${scene.sequence}...`, { id: 'image-gen' });

    try {
      // Prepare reference image if useReference is enabled
      const referenceImage = useReference && referenceImages.length > 0 && referenceImages[0]
        ? referenceImages[0].url
        : undefined;

      console.log('[Image Generation] Request payload:', {
        prompt: scene.prompt,
        title: scene.title,
        model: selectedImageModel,
        patientId: patient.id,
        sessionId,
        referenceImage: referenceImage ? 'provided' : 'none',
      });

      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt: scene.prompt,
        title: scene.title,
        model: selectedImageModel, // Use selected model instead of hardcoded
        patientId: patient.id,
        sessionId,
        referenceImage, // Include reference image if enabled
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
        imageUrl: data.media.mediaUrl, // Presigned URL from GCS
        imageMediaId: data.media.id, // Store media library ID
      });

      toast.success('Image generated and saved to assets!', { id: 'image-gen' });
    } catch (error) {
      console.error('Image generation error:', error);
      handleUpdateScene(id, { status: 'draft' });
      toast.error(error instanceof Error ? error.message : 'Failed to generate image', { id: 'image-gen' });
    } finally {
      // Always release the lock
      setIsGeneratingAnyImage(false);
    }
  };

  const handleAnimateVideo = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (!scene || !scene.imageUrl) return;

    if (!user) {
      toast.error('Please sign in to generate videos');
      return;
    }

    handleUpdateScene(id, { status: 'animating', progress: 0 });
    toast.loading('Animating to video...', { id: `vid-${id}` });

    try {
      // Start async video generation
      const response = await authenticatedPost('/api/ai/generate-video', user, {
        prompt: scene.prompt,
        title: scene.title,
        model: 'seedance-1-lite',
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
            throw new Error('Failed to check video status');
          }

          const statusData = await statusResponse.json();

          if (statusData.status === 'completed' && statusData.mediaId) {
            clearInterval(pollInterval);

            // Fetch media from library
            const mediaResponse = await authenticatedFetch(`/api/media/${statusData.mediaId}`, user);
            if (!mediaResponse.ok) {
              throw new Error('Failed to fetch video media');
            }

            const mediaData = await mediaResponse.json();

            handleUpdateScene(id, {
              status: 'ready',
              videoUrl: mediaData.media.mediaUrl,
              videoMediaId: statusData.mediaId, // Store media library ID
              progress: 100,
            });

            toast.success('Video ready and saved to assets!', { id: `vid-${id}` });
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            handleUpdateScene(id, { status: 'draft', progress: 0 });
            toast.error('Video generation failed', { id: `vid-${id}` });
          } else {
            // Update progress
            handleUpdateScene(id, { progress: statusData.progress || 50 });
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

  // Open music generation options modal
  const handleGenerateMusic = () => {
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

    setIsGeneratingMusic(true);
    setMusicGenerationProgress(0);
    setMusicGenerationStatus('pending');
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
      });

      if (!createSceneResponse.ok) {
        const errorData = await createSceneResponse.json();
        throw new Error(errorData.error || 'Failed to create scene');
      }

      const { scene: newScene } = await createSceneResponse.json();
      console.log('[Scene Compilation] Scene created:', newScene.id);

      // Update with scene ID
      setCompilationProgress(prev => ({
        ...prev,
        sceneId: newScene.id,
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
            sequenceNumber: i,
            startTimeSeconds: 0,
            endTimeSeconds: null,
          },
        );

        if (!clipResponse.ok) {
          console.error(`Failed to add clip ${i}:`, await clipResponse.text());
        } else {
          console.log(`[Scene Compilation] Added clip ${i + 1}/${scenesWithMedia.length}`);
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

      // Step 5: Poll for completion
      await pollAssemblyStatus(newScene.id);

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

  // Poll assembly status
  const pollAssemblyStatus = async (sceneId: string) => {
    const maxAttempts = 60; // Poll for up to 5 minutes (every 5 seconds)
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      if (!user) return;

      try {
        const statusResponse = await authenticatedFetch(
          `/api/scenes/${sceneId}/assemble-async`,
          user,
        );

        if (!statusResponse.ok) {
          throw new Error('Failed to check assembly status');
        }

        const statusData = await statusResponse.json();

        if (statusData.status === 'completed') {
          // Success - update modal to completed state
          setCompilationProgress(prev => ({
            ...prev,
            status: 'completed',
            step: 'Video assembled successfully!',
            progress: 100,
          }));
          toast.success('Scene compiled and saved successfully!', { id: 'compile' });
          setIsCompiling(false);

          // Auto-close modal after 3 seconds and refresh media panel
          setTimeout(() => {
            setShowProgressModal(false);
            onClose();
          }, 3000);
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.errorMessage || 'Video assembly failed');
        } else {
          // Still processing, update progress in modal
          const progress = statusData.progress || 50;
          const step = statusData.currentStep || 'Processing';

          // Calculate actual progress (70-95% during assembly)
          const assemblyProgress = Math.min(70 + (progress * 0.25), 95);

          setCompilationProgress(prev => ({
            ...prev,
            step: `Assembling video: ${step}`,
            progress: Math.round(assemblyProgress),
          }));
          toast.loading(`Assembling video: ${step} (${progress}%)`, { id: 'compile' });

          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkStatus, 5000); // Poll every 5 seconds
          } else {
            // Timeout - scene saved but still processing
            setCompilationProgress(prev => ({
              ...prev,
              status: 'completed',
              step: 'Scene saved! Assembly is taking longer than expected.',
              progress: 95,
            }));
            toast.success(
              'Scene saved! Video assembly is taking longer than expected. Check the Scenes page for the final video.',
              { id: 'compile', duration: 6000 },
            );
            setIsCompiling(false);

            // Keep modal open so user can navigate to scenes page
          }
        }
      } catch (error) {
        console.error('Assembly polling error:', error);
        setIsCompiling(false);
        setCompilationProgress(prev => ({
          ...prev,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Assembly failed',
        }));
        toast.error(
          error instanceof Error ? error.message : 'Assembly failed',
          { id: 'compile' },
        );
      }
    };

    // Start polling
    checkStatus();
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

  return (
    <>
      {/* Full-Screen Modal Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" />

      {/* Full-Screen Modal */}
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* Top Bar */}
        <SceneGenerationTopBar
          patientName={patient.name}
          selectedModel={selectedModel}
          models={AI_MODELS}
          onModelChange={setSelectedModel}
          selectedImageModel={selectedImageModel}
          onImageModelChange={setSelectedImageModel}
          useReference={useReference}
          onUseReferenceChange={setUseReference}
          onShowReferenceModal={() => setShowReferenceModal(true)}
        />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-y-auto p-8">
          {/* Scene Cards */}
          <div className="mb-8">
            <SceneCardSequence
              scenes={scenes}
              onUpdateScene={handleUpdateScene}
              onDeleteScene={handleDeleteScene}
              onOptimizePrompt={handleOptimizePrompt}
              onGenerateImage={handleGenerateImage}
              onAnimateVideo={handleAnimateVideo}
              maxScenes={5}
            />
          </div>

          {/* Music Generation Panel */}
          <div className="mb-8">
            <MusicGenerationPanel
              audioUrl={musicUrl}
              waveformData={musicWaveform}
              duration={musicDuration}
              isGenerating={isGeneratingMusic}
              generationProgress={musicGenerationProgress}
              generationStatus={musicGenerationStatus}
              onGenerate={handleGenerateMusic}
              onChooseFromLibrary={handleChooseFromLibrary}
              onRegenerate={handleRegenerateMusic}
              onDownload={handleDownloadMusic}
              onRemove={handleRemoveMusic}
            />
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="border-t border-gray-200 bg-white px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={onClose}
              variant="ghost"
              disabled={isCompiling}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Button
              onClick={handleCompile}
              variant="primary"
              size="lg"
              disabled={!musicUrl || isCompiling}
              title={!musicUrl ? 'Generate background music first' : 'Compile scenes into video'}
            >
              {isCompiling ? 'Compiling...' : 'Compile'}
            </Button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PatientReferenceModal
        isOpen={showReferenceModal}
        onClose={() => setShowReferenceModal(false)}
        patientName={patient.name}
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
        instrumentalOption={{
          title: 'Therapeutic Instrumental Music',
          genre_tags: ['ambient', 'therapeutic', 'calming'],
          mood: 'Peaceful and calming',
          music_description: 'Gentle background music designed to create a therapeutic atmosphere with soft instrumentation and ambient sounds',
          style_prompt: 'calm therapeutic background music with gentle piano and ambient sounds',
        }}
        lyricalOption={{
          title: 'Therapeutic Song with Lyrics',
          genre_tags: ['therapeutic', 'healing', 'narrative'],
          mood: 'Hopeful and encouraging',
          music_description: 'A therapeutic song with meaningful lyrics that support the narrative journey',
          style_prompt: 'therapeutic song with meaningful lyrics about healing and growth',
          suggested_lyrics: 'Gentle verses about hope, healing, and personal growth that complement the therapeutic narrative',
        }}
      />

      <SelectMusicModal
        isOpen={showSelectMusicModal}
        onClose={() => setShowSelectMusicModal(false)}
        onSelect={handleSelectMusic}
        patientId={patient.id}
        sessionId={sessionId}
        user={user}
      />
    </>
  );
}
