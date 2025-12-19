'use client';

import type { Utterance } from './types/transcript.types';
import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { TreatmentModule } from '@/models/Schema';
import { useEffect, useState } from 'react';
import { MediaUploadModal } from '@/components/media/MediaUploadModal';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateMusicModal } from '@/components/media/GenerateMusicModal';
import { AnalyzeSelectionModal } from '@/components/sessions/AnalyzeSelectionModal';
import { AssignModuleModal } from '@/components/sessions/AssignModuleModal';
import { EditQuoteModal } from '@/components/sessions/EditQuoteModal';
import { GenerateVideoModal } from '@/components/sessions/GenerateVideoModal';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { SceneGenerationLayout } from '@/components/scenes-generation/SceneGenerationLayout';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { transformSceneCardToScenes } from '@/utils/SceneHelpers';
import { AIAssistantPanel } from './components/AIAssistantPanel';
import { LibraryPanel } from './components/LibraryPanel';
import { TranscriptPanel } from './components/TranscriptPanel';

type TranscriptViewerClientProps = {
  sessionId: string;
};

export function TranscriptViewerClient({
  sessionId,
}: TranscriptViewerClientProps) {
  const { user } = useAuth();
  const [utterances, setUtterances] = useState<Utterance[]>([]);
  const [audioUrl, setAudioUrl] = useState<string | undefined>();
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [patientId, setPatientId] = useState<string | undefined>();
  const [patientReferenceImage, setPatientReferenceImage] = useState<string | undefined>();
  const [assignedModule, setAssignedModule] = useState<TreatmentModule | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState<AIPromptOption[]>([]); // Module prompts
  const [libraryPrompts, setLibraryPrompts] = useState<AIPromptOption[]>([]); // All available prompts
  const [moduleAiPromptText, setModuleAiPromptText] = useState<string | null>(null); // Module's inline prompt
  const [_isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Modal states
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [isAssignModuleModalOpen, setIsAssignModuleModalOpen] = useState(false);
  const [showSceneGenerationModal, setShowSceneGenerationModal] = useState(false);
  const [sceneCardData, setSceneCardData] = useState<any>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectedTextSource, setSelectedTextSource] = useState<'transcript' | 'ai'>('transcript');
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  // Image modal initial data (for pre-filling from JSON actions)
  const [imageModalInitialData, setImageModalInitialData] = useState<{
    prompt?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
    style?: string;
  }>({});

  // Music modal initial data (for pre-filling from JSON actions)
  const [musicModalInitialData, setMusicModalInitialData] = useState<{
    instrumentalOption?: any;
    lyricalOption?: any;
  }>({});

  // Quote edit/delete state
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media/Library refresh trigger (for media, quotes, and notes)
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

  // Analyze Mode state (for controlling automatic text selection analysis)
  const [analyzeMode, setAnalyzeMode] = useState(false);

  // Fetch session and transcript data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch session to get audio URL, title, and module
        const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
        if (!sessionResponse.ok) {
          throw new Error('Failed to fetch session');
        }
        const sessionDataResponse = await sessionResponse.json();
        setSessionData(sessionDataResponse.session);
        setAudioUrl(sessionDataResponse.session.audioUrl);
        setSessionTitle(sessionDataResponse.session.title);
        setPatientName(sessionDataResponse.session.patient?.name || sessionDataResponse.session.group?.name || 'Unknown');
        setPatientId(sessionDataResponse.session.patient?.id);
        setPatientReferenceImage(sessionDataResponse.session.patient?.referenceImageUrl);

        // Fetch assigned module if exists
        if (sessionDataResponse.session.moduleId) {
          const moduleResponse = await authenticatedFetch(`/api/modules/${sessionDataResponse.session.moduleId}`, user);
          if (moduleResponse.ok) {
            const moduleData = await moduleResponse.json();
            setAssignedModule(moduleData.module);
          }
        }

        // Fetch transcript and utterances
        const transcriptResponse = await authenticatedFetch(`/api/sessions/${sessionId}/transcript`, user);
        if (!transcriptResponse.ok) {
          throw new Error('Failed to fetch transcript');
        }
        const transcriptData = await transcriptResponse.json();

        // Transform API data to match component interface
        const transformedUtterances: Utterance[] = transcriptData.utterances.map((u: any) => ({
          id: u.id,
          speakerId: u.speakerId,
          speakerName: u.speaker?.speakerName || u.speaker?.speakerLabel || 'Unknown',
          speakerType: u.speaker?.speakerType || 'patient',
          text: u.text,
          startTime: Number.parseFloat(u.startTimeSeconds || '0'),
          endTime: Number.parseFloat(u.endTimeSeconds || '0'),
          confidence: Number.parseFloat(u.confidenceScore || '1'),
          avatarUrl: u.avatarUrl,
        }));

        setUtterances(transformedUtterances);
      } catch (err) {
        console.error('Error fetching transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  // Fetch AI prompts when session data loads
  useEffect(() => {
    const fetchAiPrompts = async () => {
      if (!user || !sessionId) {
        return;
      }

      try {
        setIsLoadingPrompts(true);

        // Fetch module prompts
        const moduleResponse = await authenticatedFetch(`/api/sessions/${sessionId}/ai-prompts`, user);
        let modulePrompts: AIPromptOption[] = [];
        if (moduleResponse.ok) {
          const moduleData = await moduleResponse.json();
          modulePrompts = moduleData.prompts || [];
          setAiPrompts(modulePrompts);

          // Store module's inline AI prompt text
          if (moduleData.module?.aiPromptText) {
            setModuleAiPromptText(moduleData.module.aiPromptText);
          } else {
            setModuleAiPromptText(null);
          }
        }

        // Fetch all available library prompts (system + organization + private)
        const libraryResponse = await authenticatedFetch('/api/therapist/prompts', user);
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json();
          const allLibraryPrompts = libraryData.prompts || [];

          console.log(`[Transcript] Fetched ${allLibraryPrompts.length} total library prompts`);
          console.log(`[Transcript] Module prompts: ${modulePrompts.length}`);

          // Filter out prompts that are already in module prompts to avoid duplicates
          const modulePromptIds = new Set(modulePrompts.map(p => p.id));
          const filteredLibraryPrompts = allLibraryPrompts.filter(
            (p: AIPromptOption) => !modulePromptIds.has(p.id),
          );

          console.log(`[Transcript] After filtering module duplicates: ${filteredLibraryPrompts.length} library prompts`);

          setLibraryPrompts(filteredLibraryPrompts);
        }
      } catch (err) {
        console.error('Error fetching AI prompts:', err);
        // Non-critical error - don't show to user, just log it
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    fetchAiPrompts();
  }, [sessionId, user, assignedModule]); // Re-fetch when module changes

  // Handler for text selection from transcript
  const handleTextSelection = () => {
    // Only open analyze modal if Analyze Mode is enabled
    if (!analyzeMode) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setSelectedTextSource('transcript');
      setShowAnalyzeModal(true);
    }
  };

  // Handler for text selection from AI conversation
  const handleAITextSelection = () => {
    // Only open analyze modal if Analyze Mode is enabled
    if (!analyzeMode) return;

    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setSelectedTextSource('ai');
      // Show a menu to choose between saving as note or quote
      // For now, we'll show both options in the analyze modal
      setShowAnalyzeModal(true);
    }
  };

  // Handler for analyze option
  const handleAnalyze = async (promptId: string, promptText: string, text: string) => {
    console.log('Analyzing with prompt:', promptId, text.substring(0, 50));

    // Send ALL prompts to AI chat - JSON output will render with action buttons
    // Image/video generation modals will be triggered from JSON action buttons
    const fullPrompt = `${promptText}\n\nSelected text:\n"${text}"`;

    setSelectedText(text);
    setAiPrompt(fullPrompt);
  };

  // Handler for image generation
  const handleGenerateImage = async (
    prompt: string,
    model: string,
    useReference: boolean,
    referenceImage?: string,
    metadata?: {
      title?: string;
      description?: string;
      sourceQuote?: string;
      style?: string;
    },
  ) => {
    try {
      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt,
        model,
        sessionId,
        useReference,
        referenceImage, // Can be base64 or URL
        selectedText,
        title: metadata?.title,
        description: metadata?.description,
        sourceQuote: metadata?.sourceQuote,
        style: metadata?.style,
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      console.log('Image generated:', data);
      // Trigger library refresh
      setMediaRefreshKey((prev: number) => prev + 1);
    } catch (error) {
      console.error('Error generating image:', error);
    }
  };

  // Handler for video generation
  const handleGenerateVideo = async (imageId: string, duration: number) => {
    try {
      const response = await authenticatedPost('/api/ai/generate-video', user, {
        imageId,
        duration,
        sessionId,
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      console.log('Video generated:', data);
      // Trigger library refresh
    } catch (error) {
      console.error('Error generating video:', error);
    }
  };

  // Callback to open image modal with pre-filled data (from JSON actions)
  const handleOpenImageModal = (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => {
    setImageModalInitialData({
      prompt: data.prompt,
      title: data.title,
      description: data.description,
      sourceQuote: data.sourceQuote,
      style: data.style,
    });
    setShowImageModal(true);
  };

  // Callback to open video modal with pre-filled data (from JSON actions)
  const handleOpenVideoModal = (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => {
    // For now, just open the video modal with the prompt
    // TODO: Add state for initial video data if needed
    setSelectedText(data.prompt);
    setShowVideoModal(true);
  };

  // Callback to open music modal with pre-filled data (from JSON actions)
  const handleOpenMusicModal = (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => {
    setMusicModalInitialData({
      instrumentalOption: data.instrumentalOption,
      lyricalOption: data.lyricalOption,
    });
    setShowMusicModal(true);
  };

  // Callback to open scene generation modal (from JSON actions)
  const handleOpenSceneGeneration = (data: { sceneCard: any }) => {
    setSceneCardData(data.sceneCard);
    setShowSceneGenerationModal(true);
  };

  // Handler for saving quote
  const handleSaveQuote = async (quoteData: {
    quoteText: string;
    tags: string[];
    notes: string;
  }) => {
    try {
      // Get patient ID from session
      const sessionResponse = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
      if (!sessionResponse.ok) {
        throw new Error('Failed to fetch session');
      }
      const sessionData = await sessionResponse.json();
      const { sessionType, patientId, groupId } = sessionData.session;

      // Handle both individual and group sessions
      if (sessionType === 'individual') {
        // Individual session - save to single patient
        if (!patientId) {
          throw new Error('No patient associated with this individual session');
        }

        const response = await authenticatedPost('/api/quotes', user, {
          ...quoteData,
          patientId,
          sessionId,
        });

        if (!response.ok) {
          throw new Error('Failed to save quote');
        }

        const data = await response.json();
        console.log('Quote saved:', data);
      } else {
        // Group session - save to all patients in the group
        if (!groupId) {
          throw new Error('No group associated with this group session');
        }

        // Fetch all group members
        const groupResponse = await authenticatedFetch(`/api/groups/${groupId}/members`, user);
        if (!groupResponse.ok) {
          throw new Error('Failed to fetch group members');
        }

        const { members } = await groupResponse.json();

        // Create quote for each patient in the group
        for (const member of members) {
          const response = await authenticatedPost('/api/quotes', user, {
            ...quoteData,
            patientId: member.patientId,
            sessionId,
          });

          if (!response.ok) {
            console.error(`Failed to save quote for patient ${member.patientId}`);
          }
        }

        console.log(`Quote saved for ${members.length} patient(s) in group`);
      }
      // Trigger refresh of library panel
      setMediaRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
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
        // Refresh quotes list by triggering the useEffect
        setEditingQuote(null);
        // TODO: Force re-fetch - activeTab not in scope here
        // const currentTab = activeTab;
        // setActiveTab('media' as any);
        // setTimeout(() => setActiveTab(currentTab), 0);
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
        setDeletingQuote(null);
        // TODO: Force re-fetch - activeTab not in scope here
        // const currentTab = activeTab;
        // setActiveTab('media' as any);
        // setTimeout(() => setActiveTab(currentTab), 0);
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-gray-500">Loading transcript...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-red-600">Error Loading Transcript</h3>
          <p className="mb-4 text-gray-500">{error}</p>
          <button
            onClick={() => window.location.href = '/sessions'}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  if (utterances.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No Transcript Available</h3>
          <p className="mb-4 text-gray-500">
            The transcript is still being processed. Please check back in a few moments.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-indigo-600 hover:text-indigo-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* Left Panel - Transcript (manages its own width: 320px expanded, 48px collapsed) */}
        <TranscriptPanel
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          utterances={utterances}
          audioUrl={audioUrl}
          onTextSelection={handleTextSelection}
          user={user}
        />

        {/* Center Panel - AI Assistant */}
        <div className="flex min-w-0 flex-1 flex-col">
          <AIAssistantPanel
            sessionId={sessionId}
            patientName={patientName}
            user={user}
            assignedModule={assignedModule}
            triggerPrompt={aiPrompt}
            onPromptSent={() => setAiPrompt(null)}
            onAssignModule={() => setIsAssignModuleModalOpen(true)}
            onTextSelection={handleAITextSelection}
            onOpenImageModal={handleOpenImageModal}
            onOpenVideoModal={handleOpenVideoModal}
            onOpenMusicModal={handleOpenMusicModal}
            onOpenSceneGeneration={handleOpenSceneGeneration}
            onLibraryRefresh={() => setMediaRefreshKey(prev => prev + 1)}
            analyzeMode={analyzeMode}
            onAnalyzeModeChange={setAnalyzeMode}
          />
        </div>

        {/* Right Panel - Library (manages its own width: 384px expanded, 48px collapsed) */}
        <LibraryPanel
          sessionId={sessionId}
          user={user}
          sessionData={sessionData}
          onOpenUpload={() => setShowMediaUploadModal(true)}
          refreshKey={mediaRefreshKey}
        />
      </div>

      {/* Modals */}
      <AnalyzeSelectionModal
        isOpen={showAnalyzeModal}
        onClose={() => setShowAnalyzeModal(false)}
        selectedText={selectedText}
        onAnalyze={handleAnalyze}
        aiPrompts={aiPrompts}
        libraryPrompts={libraryPrompts}
        moduleAiPromptText={moduleAiPromptText}
        assignedModule={assignedModule}
        onAssignModule={() => setIsAssignModuleModalOpen(true)}
        selectedTextSource={selectedTextSource}
        onSaveAsQuote={() => {
          setShowAnalyzeModal(false);
          setShowQuoteModal(true);
        }}
      />

      <SaveQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        selectedText={selectedText}
        onSave={handleSaveQuote}
      />

      <GenerateImageModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setImageModalInitialData({}); // Clear initial data on close
        }}
        onGenerate={handleGenerateImage}
        patientName={patientName}
        patientId={patientId}
        patientReferenceImage={patientReferenceImage}
        initialPrompt={imageModalInitialData.prompt || selectedText}
        initialTitle={imageModalInitialData.title}
        initialDescription={imageModalInitialData.description}
        initialSourceQuote={imageModalInitialData.sourceQuote}
        initialStyle={imageModalInitialData.style}
      />

      <GenerateVideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onGenerate={handleGenerateVideo}
      />

      <GenerateMusicModal
        isOpen={showMusicModal}
        onClose={() => {
          setShowMusicModal(false);
          setMusicModalInitialData({}); // Clear initial data on close
        }}
        sessionId={sessionId}
        instrumentalOption={musicModalInitialData.instrumentalOption}
        lyricalOption={musicModalInitialData.lyricalOption}
        user={user}
      />

      {/* Assign Module Modal */}
      {isAssignModuleModalOpen && (
        <AssignModuleModal
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          currentModuleId={assignedModule?.id}
          onClose={() => setIsAssignModuleModalOpen(false)}
          onAssigned={() => {
            setIsAssignModuleModalOpen(false);
            // Refresh session data to get updated module
            window.location.reload();
          }}
        />
      )}

      {/* Edit Quote Modal */}
      {editingQuote && (
        <EditQuoteModal
          isOpen={!!editingQuote}
          onClose={() => setEditingQuote(null)}
          quote={editingQuote}
          onSave={handleEditQuote}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!deletingQuote}
        onClose={() => setDeletingQuote(null)}
        onConfirm={handleDeleteQuote}
        title="Delete Quote"
        message="Are you sure you want to delete this quote? This action cannot be undone."
        isDeleting={isDeleting}
      />

      {/* Media Upload Modal */}
      {showMediaUploadModal && sessionData && (
        <MediaUploadModal
          isOpen={showMediaUploadModal}
          onClose={() => setShowMediaUploadModal(false)}
          patientId={sessionData.patientId || sessionData.patient?.id}
          sessionId={sessionId}
          onSuccess={() => {
            // Trigger media refresh in LibraryPanel
            setMediaRefreshKey(prev => prev + 1);
            setShowMediaUploadModal(false);
          }}
        />
      )}

      {/* Scene Generation Modal */}
      {showSceneGenerationModal && sceneCardData && (
        <SceneGenerationLayout
          isOpen={showSceneGenerationModal}
          onClose={() => {
            setShowSceneGenerationModal(false);
            setSceneCardData(null);
            // Refresh media panel to show new scenes
            setMediaRefreshKey(prev => prev + 1);
          }}
          initialScenes={transformSceneCardToScenes(sceneCardData)}
          sessionId={sessionId}
          patient={{
            id: sessionData?.patientId || sessionData?.patient?.id || 'unknown',
            name: patientName,
            avatarUrl: patientReferenceImage,
          }}
        />
      )}
    </>
  );
}
