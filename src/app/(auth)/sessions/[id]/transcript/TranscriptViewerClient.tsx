'use client';

import type { SelectedPatientInfo, SpeakerInfo, Utterance } from './types/transcript.types';
import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { PatientOption } from '@/components/sessions/SaveNoteModal';
import type { TreatmentModule } from '@/models/Schema';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateMusicModal } from '@/components/media/GenerateMusicModal';
import { MediaUploadModal } from '@/components/media/MediaUploadModal';
import { SceneGenerationLayout } from '@/components/scenes-generation/SceneGenerationLayout';
import { AnalyzeSelectionModal } from '@/components/sessions/AnalyzeSelectionModal';
import { AssignModuleModal } from '@/components/sessions/AssignModuleModal';
import { EditQuoteModal } from '@/components/sessions/EditQuoteModal';
import { GenerateVideoModal } from '@/components/sessions/GenerateVideoModal';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
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
  const [groupName, setGroupName] = useState<string | undefined>();
  const [patientName, setPatientName] = useState<string>('');
  const [patientId, setPatientId] = useState<string | undefined>();
  const [patientReferenceImage, setPatientReferenceImage] = useState<string | undefined>();
  const [assignedModule, setAssignedModule] = useState<TreatmentModule | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [fetchedSpeakers, setFetchedSpeakers] = useState<SpeakerInfo[]>([]);
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

  // Handler for when music generation completes
  const handleTaskComplete = useCallback(() => {
    console.log('[TranscriptViewerClient] Music task completed, refreshing media...');
    setMediaRefreshKey(prev => prev + 1);
  }, []);

  // Handler for speaker reassignment
  const handleSpeakerReassign = useCallback(async (utteranceId: string, newSpeakerId: string) => {
    if (!user) return;

    // Find the utterance to get current speaker
    const utterance = utterances.find(u => u.id === utteranceId);
    if (!utterance) return;

    const response = await authenticatedFetch(
      `/api/sessions/${sessionId}/speakers/${utterance.speakerId}/utterances/${utteranceId}`,
      user,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSpeakerId }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reassign speaker');
    }

    const data = await response.json();

    // Update local state with new speaker info
    setUtterances(prev => prev.map((u) => {
      if (u.id === utteranceId) {
        return {
          ...u,
          speakerId: newSpeakerId,
          speakerName: data.utterance.speakerName || u.speakerName,
          speakerType: data.utterance.speakerType || u.speakerType,
        };
      }
      return u;
    }));
  }, [user, sessionId, utterances]);

  // Analyze Mode state (for controlling automatic text selection analysis)
  const [analyzeMode, setAnalyzeMode] = useState(false);

  // Panel visibility states
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(true);

  // Selected patient from Library Panel (determines where assets are saved)
  const [selectedPatientFromLibrary, setSelectedPatientFromLibrary] = useState<SelectedPatientInfo | null>(null);

  // Patients list for quote modal
  const [sessionPatients, setSessionPatients] = useState<PatientOption[]>([]);

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
        // Use presigned URL directly - it includes auth and doesn't need CORS
        if (sessionDataResponse.session.audioUrl) {
          setAudioUrl(sessionDataResponse.session.audioUrl);
        }
        setSessionTitle(sessionDataResponse.session.title);
        setGroupName(sessionDataResponse.session.group?.name);
        setPatientName(sessionDataResponse.session.patient?.name || sessionDataResponse.session.group?.name || 'Unknown');
        setPatientId(sessionDataResponse.session.patient?.id);
        setPatientReferenceImage(sessionDataResponse.session.patient?.referenceImageUrl);

        // Extract patients list for quote modal
        const patients: PatientOption[] = [];
        if (sessionDataResponse.session.patient) {
          patients.push({
            id: sessionDataResponse.session.patient.id,
            name: sessionDataResponse.session.patient.name,
            avatarUrl: sessionDataResponse.session.patient.avatarUrl || null,
          });
        }
        if (sessionDataResponse.session.group?.members) {
          for (const member of sessionDataResponse.session.group.members) {
            if (!patients.find(p => p.id === member.id)) {
              patients.push({
                id: member.id,
                name: member.name,
                avatarUrl: member.avatarUrl || null,
              });
            }
          }
        }
        setSessionPatients(patients);

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
          // API returns presigned URL in avatarUrl (already combines userAvatarUrl + userReferenceImageUrl)
          avatarUrl: u.avatarUrl,
          referenceImageUrl: u.referenceImageUrl,
        }));

        setUtterances(transformedUtterances);

        // Fetch speakers from API (same pattern as SpeakerLabeling)
        const speakersResponse = await authenticatedFetch(`/api/sessions/${sessionId}/speakers`, user);
        if (speakersResponse.ok) {
          const speakersData = await speakersResponse.json();
          setFetchedSpeakers(speakersData.speakers.map((s: any) => ({
            id: s.id,
            name: s.speakerName || s.speakerLabel || 'Unknown',
            type: s.speakerType || 'patient',
            initial: (s.speakerName || s.speakerLabel || 'U').charAt(0).toUpperCase(),
          })));
        }
      } catch (err) {
        console.error('Error fetching transcript:', err);
        setError(err instanceof Error ? err.message : 'Failed to load transcript');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  // Build speakers array from fetchedSpeakers (from speakers API)
  // Enrich with session patient/group data for avatars
  const speakers = useMemo(() => {
    if (fetchedSpeakers.length === 0) return [];

    // Enrich with avatars from sessionData
    return fetchedSpeakers.map((speaker) => {
      // Check if speaker matches a patient from sessionData
      let patient = null;
      if (sessionData?.patient?.name === speaker.name) {
        patient = sessionData.patient;
      } else if (sessionData?.group?.members) {
        patient = sessionData.group.members.find((m: any) => m.name === speaker.name);
      }

      return {
        ...speaker,
        avatarUrl: patient?.avatarUrl || speaker.avatarUrl,
        referenceImageUrl: patient?.referenceImageUrl || speaker.referenceImageUrl,
      };
    });
  }, [fetchedSpeakers, sessionData]);

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

          // Filter out prompts that are already in module prompts to avoid duplicates
          const modulePromptIds = new Set(modulePrompts.map(p => p.id));
          const filteredLibraryPrompts = allLibraryPrompts.filter(
            (p: AIPromptOption) => !modulePromptIds.has(p.id),
          );

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
  const handleAnalyze = async (_promptId: string, promptText: string, text: string) => {
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

      await response.json();
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

      await response.json();
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

  // Handler for saving quote - patientId comes from modal's patient selector
  const handleSaveQuote = async (quoteData: {
    patientId: string;
    quoteText: string;
    speaker: string;
  }) => {
    try {
      const response = await authenticatedPost('/api/quotes', user, {
        patientId: quoteData.patientId,
        sessionId,
        quoteText: quoteData.quoteText,
        speaker: quoteData.speaker,
        source: 'transcript_selection',
      });

      if (!response.ok) {
        throw new Error('Failed to save quote');
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
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
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
            className="text-purple-600 hover:text-purple-700"
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
            className="text-purple-600 hover:text-purple-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Three-panel workspace layout */}
      <div className="flex h-full overflow-hidden">
        {/* Left Panel - Transcript (flexible width based on panel visibility) */}
        <div className={`h-full ${
          !isAIAssistantOpen && !isLibraryOpen ? 'mx-auto max-w-4xl flex-1'
            : !isAIAssistantOpen ? 'max-w-[980px] flex-1'
                : 'w-[450px] flex-shrink-0'
        }`}
        >
          <TranscriptPanel
            sessionId={sessionId}
            sessionTitle={sessionTitle}
            utterances={utterances}
            audioUrl={audioUrl}
            onTextSelection={handleTextSelection}
            user={user}
            groupName={groupName}
            sessionDate={sessionData?.sessionDate}
            speakers={speakers}
            onSpeakerReassign={handleSpeakerReassign}
          />
        </div>

        {/* Center Panel - AI Assistant */}
        {isAIAssistantOpen && (
          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border-l border-gray-200">
            <AIAssistantPanel
              sessionId={sessionId}
              patientName={patientName}
              user={user}
              speakers={speakers}
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
              onClose={() => setIsAIAssistantOpen(false)}
            />
          </div>
        )}

        {/* Right Panel - Library (manages its own width: 384px expanded, 48px collapsed) */}
        {isLibraryOpen && (
          <LibraryPanel
            sessionId={sessionId}
            user={user}
            sessionData={sessionData}
            onOpenUpload={() => setShowMediaUploadModal(true)}
            refreshKey={mediaRefreshKey}
            onTaskComplete={handleTaskComplete}
            onClose={() => setIsLibraryOpen(false)}
            onSelectedPatientChange={setSelectedPatientFromLibrary}
            onEditQuote={quote => setEditingQuote(quote)}
            onDeleteQuote={quote => setDeletingQuote(quote)}
          />
        )}
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
        patients={sessionPatients}
        onSave={handleSaveQuote}
      />

      <GenerateImageModal
        isOpen={showImageModal}
        onClose={() => {
          setShowImageModal(false);
          setImageModalInitialData({});
          setMediaRefreshKey(prev => prev + 1); // Refresh media list
        }}
        onGenerate={handleGenerateImage}
        patientName={selectedPatientFromLibrary?.name || patientName}
        patientId={selectedPatientFromLibrary?.id || patientId}
        patientReferenceImage={selectedPatientFromLibrary?.referenceImageUrl || patientReferenceImage}
        sessionId={sessionId}
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
          setMusicModalInitialData({});
          setMediaRefreshKey(prev => prev + 1); // Refresh media list
        }}
        sessionId={sessionId}
        patientId={selectedPatientFromLibrary?.id || patientId}
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
      {showMediaUploadModal && (selectedPatientFromLibrary || sessionData) && (
        <MediaUploadModal
          isOpen={showMediaUploadModal}
          onClose={() => setShowMediaUploadModal(false)}
          patientId={selectedPatientFromLibrary?.id || sessionData?.patientId || sessionData?.patient?.id}
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
          patient={
            (selectedPatientFromLibrary?.id || sessionData?.patient?.id)
              ? {
                  id: selectedPatientFromLibrary?.id || sessionData?.patient?.id || '',
                  name: selectedPatientFromLibrary?.name || sessionData?.patient?.name || patientName,
                  avatarUrl: selectedPatientFromLibrary?.avatarUrl || sessionData?.patient?.avatarUrl,
                }
              : undefined
          }
          aiMusicOptions={sceneCardData.music_generation ? {
            instrumental: sceneCardData.music_generation.instrumental_option,
            lyrical: sceneCardData.music_generation.lyrical_option,
          } : undefined}
        />
      )}
    </>
  );
}
