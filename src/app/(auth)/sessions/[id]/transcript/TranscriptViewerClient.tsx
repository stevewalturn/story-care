'use client';

import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { TreatmentModule } from '@/models/Schema';
// import { Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MediaUploadModal } from '@/components/media/MediaUploadModal';
import {

  AnalyzeSelectionModal,
} from '@/components/sessions/AnalyzeSelectionModal';
import { AssignModuleModal } from '@/components/sessions/AssignModuleModal';
import { EditQuoteModal } from '@/components/sessions/EditQuoteModal';
import { GenerateImageModal } from '@/components/sessions/GenerateImageModal';
import { GenerateVideoModal } from '@/components/sessions/GenerateVideoModal';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog';
import { useAuth } from '@/contexts/AuthContext';
import { getAvailableTextModels } from '@/libs/ModelMetadata';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

type Utterance = {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerType: 'therapist' | 'patient' | 'group_member';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
};

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
  const [assignedModule, setAssignedModule] = useState<TreatmentModule | null>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState<AIPromptOption[]>([]); // Module prompts
  const [libraryPrompts, setLibraryPrompts] = useState<AIPromptOption[]>([]); // All available prompts
  const [_isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // Modal states
  const [showAnalyzeModal, setShowAnalyzeModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [isAssignModuleModalOpen, setIsAssignModuleModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiPrompt, setAiPrompt] = useState<string | null>(null);

  // Quote edit/delete state
  const [editingQuote, setEditingQuote] = useState<any | null>(null);
  const [deletingQuote, setDeletingQuote] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Media refresh trigger
  const [mediaRefreshKey, setMediaRefreshKey] = useState(0);

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

  // Handler for text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setShowAnalyzeModal(true);
    }
  };

  // Handler for analyze option
  const handleAnalyze = async (promptId: string, promptText: string, text: string) => {
    console.log('Analyzing with prompt:', promptId, text.substring(0, 50));

    // Check if this is a creative prompt (image/video generation)
    // Look in both module prompts and library prompts
    const prompt = aiPrompts.find(p => p.id === promptId) || libraryPrompts.find(p => p.id === promptId);

    if (prompt?.category === 'creative') {
      // For creative prompts, open the image modal
      setShowImageModal(true);
    } else {
      // For analysis/extraction/reflection prompts, send to AI chat
      // Construct the full prompt with the selected text context
      const fullPrompt = `${promptText}\n\nSelected text:\n"${text}"`;

      setSelectedText(text);
      setAiPrompt(fullPrompt);
    }
  };

  // Handler for image generation
  const handleGenerateImage = async (prompt: string, model: string, useReference: boolean, referenceImage?: string) => {
    try {
      const response = await authenticatedPost('/api/ai/generate-image', user, {
        prompt,
        model,
        sessionId,
        useReference,
        referenceImage, // Can be base64 or URL
        selectedText,
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      console.log('Image generated:', data);
      // Trigger library refresh
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
      // TODO: Trigger quotes list refresh in library panel
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
        {/* Left Panel - Transcript */}
        <div className="flex w-[320px] flex-col border-r border-gray-200 bg-white">
          <TranscriptPanel
            sessionId={sessionId}
            sessionTitle={sessionTitle}
            utterances={utterances}
            audioUrl={audioUrl}
            onTextSelection={handleTextSelection}
            user={user}
            onAssignModule={() => setIsAssignModuleModalOpen(true)}
          />
        </div>

        {/* Center Panel - AI Assistant */}
        <div className="flex max-w-[800px] flex-1 flex-col">
          <AIAssistantPanel
            sessionId={sessionId}
            patientName={patientName}
            sessionTitle={sessionTitle}
            user={user}
            assignedModule={assignedModule}
            triggerPrompt={aiPrompt}
            onPromptSent={() => setAiPrompt(null)}
          />
        </div>

        {/* Right Panel - Library */}
        <div className="flex w-[380px] flex-col border-l border-gray-200 bg-white">
          <LibraryPanel
            sessionId={sessionId}
            user={user}
            sessionData={sessionData}
            onOpenUpload={() => setShowMediaUploadModal(true)}
            refreshKey={mediaRefreshKey}
          />
        </div>
      </div>

      {/* Modals */}
      <AnalyzeSelectionModal
        isOpen={showAnalyzeModal}
        onClose={() => setShowAnalyzeModal(false)}
        selectedText={selectedText}
        onAnalyze={handleAnalyze}
        aiPrompts={aiPrompts}
        libraryPrompts={libraryPrompts}
        assignedModule={assignedModule}
        onAssignModule={() => setIsAssignModuleModalOpen(true)}
      />

      <SaveQuoteModal
        isOpen={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        selectedText={selectedText}
        onSave={handleSaveQuote}
      />

      <GenerateImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onGenerate={handleGenerateImage}
        patientName={patientName}
        initialPrompt={selectedText}
      />

      <GenerateVideoModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onGenerate={handleGenerateVideo}
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
    </>
  );
}

// Transcript Panel Component
function TranscriptPanel({
  sessionId,
  sessionTitle,
  utterances,
  audioUrl,
  onTextSelection,
  user,
  onAssignModule,
}: {
  sessionId: string;
  sessionTitle: string;
  utterances: Utterance[];
  audioUrl?: string;
  onTextSelection: () => void;
  user: any;
  onAssignModule: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Load session summary on mount
  useEffect(() => {
    const loadSessionSummary = async () => {
      try {
        setSummaryLoading(true);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/summary`, user);

        if (response.ok) {
          const data = await response.json();
          setSessionSummary(data.summary);
        }
      } catch (error) {
        console.error('Error loading session summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSessionSummary();
  }, [sessionId, user]);

  const filteredUtterances = searchQuery
    ? utterances.filter(u =>
        u.text.toLowerCase().includes(searchQuery.toLowerCase())
        || u.speakerName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : utterances;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/sessions'}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-gray-900">{sessionTitle}</h2>
          <button
            onClick={onAssignModule}
            className="rounded-lg bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
            title="Assign Treatment Module"
          >
            Module
          </button>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-4">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Session Summary */}
      {summaryLoading && (
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium text-indigo-900">Generating session insights...</span>
          </div>
        </div>
      )}
      {sessionSummary && (
        <div className="border-b border-indigo-100">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 text-left transition-all hover:from-indigo-100 hover:to-purple-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-xs font-semibold text-indigo-900">Session Insights</span>
              </div>
              <svg
                className={`h-4 w-4 text-indigo-600 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {summaryExpanded && (
            <div
              className="max-h-80 overflow-y-auto border-t border-indigo-100 bg-white px-4 py-3"
              onMouseUp={onTextSelection}
            >
              <div className="prose-xs prose max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-h1:mb-2 prose-h1:text-sm prose-h2:mb-1.5 prose-h2:text-xs prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-xs prose-p:text-xs prose-p:leading-relaxed prose-p:text-gray-700 prose-blockquote:my-2 prose-blockquote:border-l-4 prose-blockquote:border-purple-400 prose-blockquote:bg-purple-50 prose-blockquote:px-3 prose-blockquote:py-1.5 prose-blockquote:text-xs prose-strong:font-semibold prose-strong:text-gray-900 prose-code:rounded prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:text-indigo-600 prose-ol:text-xs prose-ol:text-gray-700 prose-ul:text-xs prose-ul:text-gray-700 prose-li:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sessionSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instruction Banner */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <span>💡</span>
          Select transcript text to analyze or extract quotes
        </p>
      </div>

      {/* Transcript Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto p-4"
        onMouseUp={onTextSelection}
      >
        {filteredUtterances.map(utterance => (
          <div key={utterance.id} className="flex gap-3">
            {/* Avatar */}
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
              utterance.speakerType === 'therapist' ? 'bg-blue-100' : 'bg-green-100'
            }`}
            >
              <svg
                className={`h-4 w-4 ${
                  utterance.speakerType === 'therapist' ? 'text-blue-600' : 'text-green-600'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* Message Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">{utterance.speakerName}</span>
                <span className="text-xs text-gray-500">
                  {formatTime(utterance.startTime)}
                  {' '}
                  -
                  {formatTime(utterance.endTime)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {utterance.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Re-label Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => window.location.href = `/sessions/${sessionId}/speakers`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Re-label Speakers
        </button>
      </div>
    </>
  );
}

// AI Assistant Panel Component
function AIAssistantPanel({
  sessionId,
  patientName,
  sessionTitle,
  user,
  assignedModule,
  triggerPrompt,
  onPromptSent,
}: {
  sessionId: string;
  patientName: string;
  sessionTitle: string;
  user: any;
  assignedModule: TreatmentModule | null;
  triggerPrompt: string | null;
  onPromptSent: () => void;
}) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [_isLoadingHistory, _setIsLoadingHistory] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        _setIsLoadingHistory(true);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/chat`, user);

        if (response.ok) {
          const data = await response.json();
          const loadedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        _setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [sessionId, user]);

  // Watch for trigger prompt from analyze modal
  useEffect(() => {
    if (triggerPrompt) {
      handleSendMessage(triggerPrompt);
      onPromptSent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPrompt]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || prompt;
    if (!textToSend.trim() || isLoading) {
      return;
    }

    const userMessage = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await authenticatedPost('/api/ai/chat', user, {
        messages: [...messages, userMessage],
        sessionId,
        model: selectedModel,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamplePrompt = (exampleText: string) => {
    handleSendMessage(exampleText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              AI Assistant (
              {patientName}
              's Narrative)
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Session:
              {sessionTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              AI Analysis Ready
            </span>
            <button
              onClick={() => setMessages([])}
              className="text-gray-500 hover:text-gray-700"
              title="Clear chat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Module Context Badge */}
        {assignedModule && (
          <div className="border-t border-gray-200 bg-indigo-50 px-4 py-2">
            <div className="flex items-center gap-2 text-xs">
              <svg className="h-4 w-4 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-indigo-900">
                Using Module:
                {' '}
                {assignedModule.name}
              </span>
              <span className="text-indigo-600">
                (
                {assignedModule.domain}
                )
              </span>
            </div>
          </div>
        )}

        {/* Model Selector */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="ai-model" className="text-sm font-medium text-gray-700">
              Model:
            </label>
            <select
              id="ai-model"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {Object.entries(getAvailableTextModels()).map(([provider, models]) => (
                <optgroup key={provider} label={provider}>
                  {models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Chat Messages or Empty State */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="max-w-md text-center">
              {/* Chat Icon */}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">Therapeutic Chat Assistant</h3>
              <p className="mb-6 text-sm text-gray-500">
                Ask questions about this session, request insights, or describe what you'd like to visualize.
              </p>

              {/* Example Prompts */}
              <div className="mb-6 space-y-3 text-left">
                <div className="mb-2 text-xs font-medium text-gray-700">For Analysis:</div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExamplePrompt('What are the key themes in this session?')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "What are the key themes in this session?"
                  </button>
                  <button
                    onClick={() => handleExamplePrompt('How is the patient progressing?')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "How is the patient progressing?"
                  </button>
                </div>

                <div className="mt-4 mb-2 text-xs font-medium text-gray-700">For Media:</div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExamplePrompt('Create an image showing the patient\'s main metaphor')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "Create an image showing the patient's main metaphor"
                  </button>
                  <button
                    onClick={() => handleExamplePrompt('Visualize the patient\'s journey from problem to solution')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "Visualize the patient's journey from problem to solution"
                  </button>
                </div>
              </div>

              {/* Prompt Selector */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Choose a favorite prompt...</span>
                  <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                    <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none text-sm leading-relaxed
                      prose-headings:font-semibold prose-headings:text-gray-900
                      prose-h1:mt-4 prose-h1:mb-3 prose-h1:text-lg
                      prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-base
                      prose-h3:mt-3 prose-h3:mb-2 prose-h3:text-sm
                      prose-p:my-2 prose-p:text-gray-700
                      prose-a:text-indigo-600 prose-a:no-underline
                      hover:prose-a:underline prose-blockquote:rounded-r
                      prose-blockquote:border-l-4 prose-blockquote:border-indigo-500
                      prose-blockquote:bg-indigo-50 prose-blockquote:px-4
                      prose-blockquote:py-2 prose-blockquote:text-gray-700
                      prose-blockquote:not-italic prose-strong:font-semibold
                      prose-strong:text-gray-900 prose-code:rounded
                      prose-code:bg-indigo-50 prose-code:px-1
                      prose-code:py-0.5 prose-code:font-mono prose-code:text-xs
                      prose-code:text-indigo-600 prose-ol:my-2
                      prose-ul:my-2 prose-li:my-1 prose-li:text-gray-700"
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                    <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="rounded-lg bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Chat about this transcript, or select text to begin..."
            className="w-full rounded-lg border border-gray-200 py-3 pr-12 pl-4 text-sm focus:border-indigo-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !prompt.trim()}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

// Library Panel Component
function LibraryPanel({
  sessionId,
  user,
  sessionData,
  onOpenUpload,
  refreshKey,
}: {
  sessionId: string;
  user: any;
  sessionData: any;
  onOpenUpload: () => void;
  refreshKey: number;
}) {
  const [activeTab, setActiveTab] = useState<'media' | 'quotes' | 'notes' | 'profile'>('media');
  const [media, setMedia] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = useState(true);
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'audio'>('all');

  // Load media for this session
  useEffect(() => {
    const loadMedia = async () => {
      try {
        setIsLoadingMedia(true);
        const params = new URLSearchParams({
          sessionId,
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

    if (activeTab === 'media') {
      loadMedia();
    }
  }, [sessionId, activeTab, filterType, searchQuery, user, refreshKey]);

  // Load quotes for this session
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoadingQuotes(true);
        const params = new URLSearchParams({
          sessionId,
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

    if (activeTab === 'quotes') {
      loadQuotes();
    }
  }, [sessionId, activeTab, searchQuery, user]);

  // Load notes for this session
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setIsLoadingNotes(true);
        const params = new URLSearchParams({
          sessionId,
        });

        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await authenticatedFetch(`/api/notes?${params.toString()}`, user);

        if (response.ok) {
          const data = await response.json();
          setNotes(data.notes || []);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      } finally {
        setIsLoadingNotes(false);
      }
    };

    if (activeTab === 'notes') {
      loadNotes();
    }
  }, [sessionId, activeTab, searchQuery, user]);

  // Helper function to format date
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

  // Get counts by type
  const videosCount = media.filter(m => m.mediaType === 'video').length;
  const imagesCount = media.filter(m => m.mediaType === 'image').length;
  const audioCount = media.filter(m => m.mediaType === 'audio').length;

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Library</h2>
          <div className="flex gap-2">
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button className="text-gray-500 hover:text-gray-700">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="-mb-px flex gap-1 border-b border-gray-200">
          {['Media', 'Quotes', 'Notes', 'Profile'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab.toLowerCase() as any)}
              className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.toLowerCase()
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Media Tab Content */}
      {activeTab === 'media' && (
        <>
          {/* Controls */}
          <div className="space-y-3 border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Media (
                {media.length}
                )
              </h3>
              <div className="flex gap-2">
                <button className="text-gray-500 hover:text-gray-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
                <button
                  onClick={onOpenUpload}
                  className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </button>
                <button className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-lg border border-gray-200 py-1.5 pr-3 pl-8 text-xs focus:border-indigo-500 focus:outline-none"
                />
                <svg className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option>All Sources</option>
                <option>Generated</option>
                <option>Uploaded</option>
              </select>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
              </select>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-4 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={filterType === 'all' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                All (
                {media.length}
                )
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={filterType === 'video' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Videos (
                {videosCount}
                )
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={filterType === 'image' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Images (
                {imagesCount}
                )
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={filterType === 'audio' ? 'font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'}
              >
                Music (
                {audioCount}
                )
              </button>
            </div>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoadingMedia ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="text-sm text-gray-500">Loading media...</p>
              </div>
            ) : media.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500">No media yet for this session</p>
                <p className="mt-1 text-xs text-gray-400">Generated content will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {media.map(item => (
                  <div
                    key={item.id}
                    className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 transition-all hover:border-indigo-300 hover:shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-100">
                      {item.mediaType === 'video'
                        ? (
                            <>
                              <img
                                src={item.thumbnailUrl || item.mediaUrl}
                                alt={item.title}
                                className="h-full w-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 transition-colors group-hover:bg-indigo-600">
                                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 20 20">
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
                              <div className="flex h-full items-center justify-center">
                                <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                            )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h4 className="mb-1 line-clamp-1 text-sm font-medium text-gray-900">
                        {item.title}
                      </h4>
                      <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="capitalize">{item.mediaType}</span>
                        <span>•</span>
                        <span>{formatDate(item.createdAt)}</span>
                      </div>
                      {item.description && (
                        <p className="mb-2 line-clamp-2 text-xs text-gray-600">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {item.tags && item.tags.length > 0 && item.tags.map((tag: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.sourceType && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                            {item.sourceType.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingQuotes ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Loading quotes...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No quotes extracted yet</p>
              <p className="mt-1 text-xs text-gray-400">Select text from the transcript to create quotes</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotes.map(quote => (
                <div
                  key={quote.id}
                  className="rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">
                        {quote.speakerName || quote.speakerType || 'Unknown'}
                      </span>
                      {quote.startTimeSeconds && (
                        <span className="text-xs text-gray-500">
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
                      {/* TODO: Fix scoping issue with setEditingQuote/setDeletingQuote */}
                      {/* <button
                        onClick={() => setEditingQuote(quote)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
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
                      </button> */}
                    </div>
                  </div>

                  {/* Quote Text */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                    {quote.quoteText}
                  </p>

                  {/* Tags */}
                  {quote.tags && quote.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {quote.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {quote.notes && (
                    <p className="mt-2 text-xs text-gray-500 italic">
                      Note:
                      {' '}
                      {quote.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div className="flex-1 overflow-y-auto p-4">
          {isLoadingNotes ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-sm text-gray-500">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">No notes for this session yet</p>
              <p className="mt-1 text-xs text-gray-400">Notes will appear here once created</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map(note => (
                <div
                  key={note.id}
                  className="rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
                >
                  {/* Header */}
                  <div className="mb-2 flex items-start justify-between">
                    <h4 className="font-medium text-gray-900">{note.title || 'Untitled Note'}</h4>
                    <span className="text-xs text-gray-500">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {note.tags.map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
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
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4">
          {!sessionData ? (
            <div className="py-12 text-center">
              <p className="text-sm text-gray-500">Loading profile...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Patient/Group Info */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar/Image */}
                  {(sessionData.patient?.avatarUrl || sessionData.patient?.referenceImageUrl) ? (
                    <img
                      src={sessionData.patient.avatarUrl || sessionData.patient.referenceImageUrl}
                      alt={sessionData.patient?.name || sessionData.group?.name}
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {sessionData.patient?.name || sessionData.group?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {sessionData.sessionType === 'individual' ? 'Individual Session' : 'Group Session'}
                    </p>
                    {sessionData.patient?.email && (
                      <p className="mt-1 text-xs text-gray-500">{sessionData.patient.email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Session Info */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Session Details</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {sessionData.sessionDate ? new Date(sessionData.sessionDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium text-gray-900 capitalize">{sessionData.sessionType || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      sessionData.transcriptionStatus === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : sessionData.transcriptionStatus === 'processing'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                    >
                      {sessionData.transcriptionStatus || 'pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Patient Info (if individual session) */}
              {sessionData.patient && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Patient Information</h4>
                  <div className="space-y-2">
                    {sessionData.patient.dateOfBirth && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Date of Birth:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(sessionData.patient.dateOfBirth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {sessionData.patient.createdAt && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Patient Since:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(sessionData.patient.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Module Info (if assigned) */}
              {sessionData.module && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h4 className="mb-3 text-sm font-semibold text-gray-900">Treatment Module</h4>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-indigo-600">{sessionData.module.name}</p>
                    <p className="text-xs text-gray-600">{sessionData.module.description}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
