'use client';

import type { SaveQuoteData, SelectedPatientInfo, SpeakerInfo, Utterance } from './types/transcript.types';
import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { QuoteWithPatient } from '@/components/sessions/BulkSaveQuotesModal';
import type { PatientOption } from '@/components/sessions/SaveNoteModal';
import type { TreatmentModule } from '@/models/Schema';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { GenerateImageModal } from '@/components/media/GenerateImageModal';
import { GenerateMusicModal } from '@/components/media/GenerateMusicModal';
import { GenerateVideoModal } from '@/components/media/GenerateVideoModal';
import { MediaUploadModal } from '@/components/media/MediaUploadModal';
import { SceneGenerationLayout } from '@/components/scenes-generation/SceneGenerationLayout';
import { AnalyzeSelectionModal } from '@/components/sessions/AnalyzeSelectionModal';
import { AssignModuleModal } from '@/components/sessions/AssignModuleModal';
import { BulkSaveQuotesModal } from '@/components/sessions/BulkSaveQuotesModal';
import { EditQuoteModal } from '@/components/sessions/EditQuoteModal';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { SpeakerLabelingModal } from '@/components/sessions/SpeakerLabelingModal';
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

// Helper: resolve speaker display name from API response context
function resolveSpeakerDisplayName(speaker: any, apiData: any): string {
  // 1. Explicit speaker name (from labeling)
  if (speaker.speakerName?.trim()) return speaker.speakerName.trim();

  // 2. Resolve from linked userId via session context
  if (speaker.userId) {
    if (speaker.userId === apiData.sessionContext?.therapistId) {
      return apiData.sessionContext.therapistName || speaker.speakerLabel || 'Unknown';
    }
    const matchedPatient = apiData.therapistPatients?.find((p: any) => p.id === speaker.userId);
    if (matchedPatient?.name) return matchedPatient.name;
  }

  // 3. Fallback to raw label
  return speaker.speakerLabel || 'Unknown';
}

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
  const [showBulkQuoteModal, setShowBulkQuoteModal] = useState(false);
  const [bulkQuotes, setBulkQuotes] = useState<any[]>([]);
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [isAssignModuleModalOpen, setIsAssignModuleModalOpen] = useState(false);
  const [showSceneGenerationModal, setShowSceneGenerationModal] = useState(false);
  const [sceneCardData, setSceneCardData] = useState<any>(null);
  const [showSpeakerLabelingModal, setShowSpeakerLabelingModal] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedTextSource, setSelectedTextSource] = useState<'transcript' | 'ai'>('transcript');
  const [selectedUtterance, setSelectedUtterance] = useState<Utterance | null>(null);
  // Separate state for system prompt and user text (for Analyze Selection modal)
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string | null>(null);
  const [aiUserText, setAiUserText] = useState<string | null>(null);

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

  // Video modal initial data (for pre-filling from JSON actions)
  const [videoModalInitialData, setVideoModalInitialData] = useState<{
    prompt?: string;
    title?: string;
    sourceQuote?: string;
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

  // Handler for speaker labeling modal save - refresh speakers and utterances
  const handleSpeakerLabelingSave = useCallback(async () => {
    try {
      // Re-fetch speakers
      const speakersResponse = await authenticatedFetch(`/api/sessions/${sessionId}/speakers`, user);
      if (speakersResponse.ok) {
        const speakersData = await speakersResponse.json();
        setFetchedSpeakers(speakersData.speakers.map((s: any) => {
          const name = resolveSpeakerDisplayName(s, speakersData);
          return {
            id: s.id,
            name,
            type: s.speakerType || 'patient',
            initial: name.charAt(0).toUpperCase(),
          };
        }));
      }

      // Re-fetch utterances to get updated speaker names
      const transcriptResponse = await authenticatedFetch(`/api/sessions/${sessionId}/transcript`, user);
      if (transcriptResponse.ok) {
        const transcriptData = await transcriptResponse.json();
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
          referenceImageUrl: u.referenceImageUrl,
        }));
        setUtterances(transformedUtterances);
      }
    } catch (error) {
      console.error('Error refreshing speaker data:', error);
    }
  }, [sessionId, user]);

  // Panel visibility states
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(true);

  // Panel collapse states (panels always visible, but can be collapsed)
  const [isTranscriptCollapsed, setIsTranscriptCollapsed] = useState(false);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);

  // Audio seek control - set by LibraryPanel/QuotesTab to seek audio in TranscriptPanel
  const [seekToTimestamp, setSeekToTimestamp] = useState<number | null>(null);

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
          setFetchedSpeakers(speakersData.speakers.map((s: any) => {
            const name = resolveSpeakerDisplayName(s, speakersData);
            return {
              id: s.id,
              name,
              type: s.speakerType || 'patient',
              initial: name.charAt(0).toUpperCase(),
            };
          }));
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

  // Derive archive state from session data
  const isArchived = useMemo(() => !!sessionData?.archivedAt, [sessionData]);

  // Derive read-only state (non-owned session after patient reassignment)
  const isReadOnly = useMemo(() => !!sessionData?.isReadOnly, [sessionData]);

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

  // Find the utterance that contains the selected text
  const findUtteranceForSelection = useCallback((selectedTextStr: string): Utterance | null => {
    if (!selectedTextStr || selectedTextStr.length < 10) return null;

    // Normalize text for comparison (remove extra whitespace, case insensitive)
    const normalizedSelection = selectedTextStr.toLowerCase().trim();

    // Find utterance that contains this text
    return utterances.find((u) => {
      const normalizedUtteranceText = u.text.toLowerCase().trim();
      // Check if utterance text contains the selection (or vice versa for partial selections)
      return normalizedUtteranceText.includes(normalizedSelection)
        || normalizedSelection.includes(normalizedUtteranceText.substring(0, 50));
    }) || null;
  }, [utterances]);

  // Handler for text selection from transcript (tracks selection for use in chatbox)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      // Update selectedText for use in chatbox prompts
      setSelectedText(text);
      setSelectedTextSource('transcript');

      // Find matching utterance for timestamps
      const matchingUtterance = findUtteranceForSelection(text);
      setSelectedUtterance(matchingUtterance);
    }
  };

  // Handler for "Analyze" button from floating menu - opens AnalyzeSelectionModal
  const handleOpenAnalyzeModal = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setSelectedTextSource('transcript');
      const matchingUtterance = findUtteranceForSelection(text);
      setSelectedUtterance(matchingUtterance);
      setShowAnalyzeModal(true);
    }
  }, [findUtteranceForSelection]);

  // Handler for "Save as Quote" from floating menu in TranscriptPanel
  const handleSaveQuoteFromSelection = useCallback((data: SaveQuoteData) => {
    // Create a quote object matching the BulkSaveQuotesModal format
    const quote = {
      quote_text: data.selectedText,
      speaker: data.speakerName,
      speaker_id: data.speakerId,
      patient_name: data.speakerName, // For auto-matching patient
      start_time_seconds: data.startTime,
      end_time_seconds: data.endTime,
      tags: [],
    };
    setBulkQuotes([quote]);
    setShowBulkQuoteModal(true);
  }, []);

  // Handler for text selection from AI conversation (just tracks selection, no modal)
  const handleAITextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setSelectedTextSource('ai');
    }
  };

  // Handler for analyze option
  const handleAnalyze = async (_promptId: string, promptText: string, text: string) => {
    // Send ALL prompts to AI chat - JSON output will render with action buttons
    // Image/video generation modals will be triggered from JSON action buttons
    // NEW: Pass system prompt and user text separately so chat shows only user text
    setSelectedText(text);
    setAiSystemPrompt(promptText);
    setAiUserText(text);
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

  // Handler for video generation (called by GenerateVideoModal after completion)
  const handleGenerateVideo = (_videoUrl: string, _prompt: string) => {
    // Video was already generated and saved by the modal
    // Just refresh the media library
    setMediaRefreshKey((prev: number) => prev + 1);
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
    sourceQuote?: string;
  }) => {
    setVideoModalInitialData({
      prompt: data.prompt,
      title: data.title,
      sourceQuote: data.sourceQuote,
    });
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
    startTimeSeconds?: number;
    endTimeSeconds?: number;
  }) => {
    try {
      const response = await authenticatedPost('/api/quotes', user, {
        patientId: quoteData.patientId,
        sessionId,
        quoteText: quoteData.quoteText,
        speaker: quoteData.speaker,
        startTimeSeconds: quoteData.startTimeSeconds,
        endTimeSeconds: quoteData.endTimeSeconds,
        source: 'transcript_selection',
        validateAgainstTranscript: true, // Require verbatim match for clinical accuracy
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Handle specific validation errors
        if (errorData.code === 'QUOTE_NOT_IN_TRANSCRIPT') {
          throw new Error('This quote does not match the transcript verbatim. Please select text directly from the transcript.');
        }

        throw new Error(errorData.error || 'Failed to save quote');
      }

      // Trigger refresh of library panel
      setMediaRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error saving quote:', error);
      throw error;
    }
  };

  // Handler for bulk quote save (from BulkSaveQuotesModal)
  const handleBulkSaveQuotes = async (quotePatientMappings: QuoteWithPatient[]) => {
    try {
      const response = await Promise.all(
        quotePatientMappings.map(({ quoteIndex, patientId }) => {
          const quote = bulkQuotes[quoteIndex];
          return authenticatedPost('/api/quotes', user, {
            patientId,
            sessionId,
            quoteText: quote.quote_text || quote.text,
            speakerId: quote.speaker_id || undefined,
            speaker: quote.speaker || 'Unknown',
            tags: quote.tags || [],
            notes: quote.context || quote.significance || '',
            startTimeSeconds: quote.start_time_seconds ?? quote.timestamp?.start,
            endTimeSeconds: quote.end_time_seconds ?? quote.timestamp?.end,
            source: 'transcript_selection',
          });
        }),
      );

      const successCount = response.filter(r => r.ok).length;
      setMediaRefreshKey(prev => prev + 1);

      if (successCount < quotePatientMappings.length) {
        alert(`Saved ${successCount}/${quotePatientMappings.length} quotes.`);
      }
    } catch (error) {
      console.error('Error saving quotes:', error);
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
      {/* Archive banner */}
      {isArchived && (
        <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 3h14l-1.405 4.544A2 2 0 0115.64 9H8.36a2 2 0 01-1.955-1.456L5 3zm0 0v16a1 1 0 001 1h12a1 1 0 001-1V3" />
          </svg>
          This session is archived (read-only). Unarchive to make changes.
        </div>
      )}

      {/* Read-only banner for non-owned sessions */}
      {isReadOnly && !isArchived && (
        <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800">
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View only — this session was created by another therapist.
        </div>
      )}

      {/* Three-panel workspace layout */}
      <div className="flex h-full overflow-hidden">
        {/* Left Panel - Transcript (flexible width based on panel visibility) */}
        <div className={`h-full ${
          isTranscriptCollapsed ? 'w-12 flex-shrink-0'
            : !isAIAssistantOpen && isLibraryCollapsed ? 'mx-auto max-w-4xl flex-1'
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
            onSaveQuote={(isArchived || isReadOnly) ? undefined : handleSaveQuoteFromSelection}
            user={user}
            groupName={groupName}
            sessionDate={sessionData?.sessionDate}
            speakers={speakers}
            sessionPatients={sessionPatients}
            onSpeakerReassign={(isArchived || isReadOnly) ? undefined : handleSpeakerReassign}
            isCollapsed={isTranscriptCollapsed}
            onToggleCollapse={() => setIsTranscriptCollapsed(!isTranscriptCollapsed)}
            seekToTimestamp={seekToTimestamp}
            onSeekComplete={() => setSeekToTimestamp(null)}
            audioDurationSeconds={sessionData?.audioDurationSeconds}
            onOpenAnalyzeModal={(isArchived || isReadOnly) ? undefined : handleOpenAnalyzeModal}
            onOpenSpeakerLabeling={(isArchived || isReadOnly) ? undefined : () => setShowSpeakerLabelingModal(true)}
            isArchived={isArchived || isReadOnly}
          />
        </div>

        {/* Center Panel - AI Assistant */}
        {isAIAssistantOpen && (
          <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden border-l border-gray-200">
            <AIAssistantPanel
              sessionId={sessionId}
              patientName={patientName}
              patientId={patientId}
              user={user}
              speakers={speakers}
              utterances={utterances}
              assignedModule={assignedModule}
              triggerSystemPrompt={aiSystemPrompt}
              triggerUserText={aiUserText}
              currentSelectedText={selectedText}
              onPromptSent={() => {
                setAiSystemPrompt(null);
                setAiUserText(null);
                setSelectedText('');
              }}
              onAssignModule={(isArchived || isReadOnly) ? undefined : () => setIsAssignModuleModalOpen(true)}
              onTextSelection={handleAITextSelection}
              onOpenImageModal={(isArchived || isReadOnly) ? undefined : handleOpenImageModal}
              onOpenVideoModal={(isArchived || isReadOnly) ? undefined : handleOpenVideoModal}
              onOpenMusicModal={(isArchived || isReadOnly) ? undefined : handleOpenMusicModal}
              onOpenSceneGeneration={(isArchived || isReadOnly) ? undefined : handleOpenSceneGeneration}
              onLibraryRefresh={() => setMediaRefreshKey(prev => prev + 1)}
              onClose={() => setIsAIAssistantOpen(false)}
              onJumpToTimestamp={setSeekToTimestamp}
              isArchived={isArchived || isReadOnly}
            />
          </div>
        )}

        {/* Right Panel - Library (always visible, collapsible) */}
        <LibraryPanel
          sessionId={sessionId}
          user={user}
          sessionData={sessionData}
          onOpenUpload={(isArchived || isReadOnly) ? undefined : () => setShowMediaUploadModal(true)}
          onOpenGenerateImage={(isArchived || isReadOnly) ? undefined : () => setShowImageModal(true)}
          onOpenGenerateVideo={(isArchived || isReadOnly) ? undefined : () => setShowVideoModal(true)}
          onOpenGenerateMusicLyrical={(isArchived || isReadOnly) ? undefined : () => {
            setMusicModalInitialData({
              lyricalOption: {
                title: 'Therapeutic Song',
                music_description: 'A lyrical song based on this therapy session',
              },
            });
            setShowMusicModal(true);
          }}
          onOpenGenerateMusicInstrumental={(isArchived || isReadOnly) ? undefined : () => {
            setMusicModalInitialData({
              instrumentalOption: {
                title: 'Therapeutic Music',
                music_description: 'An instrumental piece based on this therapy session',
              },
            });
            setShowMusicModal(true);
          }}
          onOpenGenerateScene={(isArchived || isReadOnly) ? undefined : () => {
            // Open scene generation with empty initial scenes
            setSceneCardData({ scenes: [] });
            setShowSceneGenerationModal(true);
          }}
          refreshKey={mediaRefreshKey}
          onTaskComplete={handleTaskComplete}
          onSelectedPatientChange={setSelectedPatientFromLibrary}
          onEditQuote={(isArchived || isReadOnly) ? undefined : quote => setEditingQuote(quote)}
          onDeleteQuote={(isArchived || isReadOnly) ? undefined : quote => setDeletingQuote(quote)}
          isCollapsed={isLibraryCollapsed}
          onToggleCollapse={() => setIsLibraryCollapsed(!isLibraryCollapsed)}
          onJumpToTimestamp={setSeekToTimestamp}
          isArchived={isArchived}
          isReadOnly={isReadOnly}
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
        onClose={() => {
          setShowQuoteModal(false);
          setSelectedUtterance(null);
        }}
        selectedText={selectedText}
        patients={sessionPatients}
        onSave={handleSaveQuote}
        startTimeSeconds={selectedUtterance?.startTime}
        endTimeSeconds={selectedUtterance?.endTime}
        speakerName={selectedUtterance?.speakerName}
      />

      {/* Bulk Quote Save Modal (used for transcript text selection) */}
      <BulkSaveQuotesModal
        isOpen={showBulkQuoteModal}
        onClose={() => {
          setShowBulkQuoteModal(false);
          setBulkQuotes([]);
        }}
        quotes={bulkQuotes}
        patients={sessionPatients}
        onSave={handleBulkSaveQuotes}
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
        onClose={() => {
          setShowVideoModal(false);
          setVideoModalInitialData({});
          setMediaRefreshKey(prev => prev + 1);
        }}
        onGenerate={handleGenerateVideo}
        initialPrompt={videoModalInitialData.prompt}
        sessionId={sessionId}
        patientId={selectedPatientFromLibrary?.id || patientId}
        patientName={selectedPatientFromLibrary?.name || patientName}
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

      {/* Speaker Labeling Modal */}
      <SpeakerLabelingModal
        isOpen={showSpeakerLabelingModal}
        onClose={() => setShowSpeakerLabelingModal(false)}
        sessionId={sessionId}
        onSave={handleSpeakerLabelingSave}
      />
    </>
  );
}
