'use client';

/**
 * AI Assistant Panel Component
 * Handles AI chat interface, model selection, and message rendering with JSON output support
 */

import type { AIAssistantPanelProps } from '../types/transcript.types';
import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { QuoteWithPatient } from '@/components/sessions/BulkSaveQuotesModal';
import type { PatientOption } from '@/components/sessions/SaveNoteModal';
import type { ModuleAiPrompt } from '@/models/Schema';
import { AlertCircle, ChevronDown, Download, Eye, FileText, Quote, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CreatePromptModal } from '@/components/prompts/CreatePromptModal';
import { EditPromptModal } from '@/components/prompts/EditPromptModal';
import { PromptLibrary } from '@/components/prompts/PromptLibrary';
import { AIQuoteExtractorModal } from '@/components/sessions/AIQuoteExtractorModal';
import { AssistantMessageContent } from '@/components/sessions/AssistantMessageContent';
import { BulkSaveQuotesModal } from '@/components/sessions/BulkSaveQuotesModal';
import { JSONOutputRenderer } from '@/components/sessions/JSONOutputRenderer';
import { MessagePreviewModal } from '@/components/sessions/MessagePreviewModal';
import { ModuleSelectorModal } from '@/components/sessions/ModuleSelectorModal';
import { SaveNoteModal } from '@/components/sessions/SaveNoteModal';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { Modal } from '@/components/ui/Modal';

import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { downloadAsTextFile, stripMarkdownForPlainText } from '@/utils/FileDownloadHelpers';
import { detectAndExtractJSON, looksLikeBrokenJSON, shouldRetryForMalformedJSON } from '@/utils/JSONSchemaDetector';
import { markdownToHTML } from '@/utils/MarkdownToHTML';
import { formatTranscriptForAI, truncateTranscript } from '@/utils/TranscriptFormatter';

// AI Models grouped by provider - matching Figma design
const AI_MODEL_GROUPS = [
  {
    provider: 'OpenAI',
    models: [
      { id: 'gpt-4.1', name: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
      { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
      { id: 'gpt-4o', name: 'GPT-4o' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    ],
  },
  {
    provider: 'Google',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
    ],
  },
];

// Helper to get model display name
const getModelDisplayName = (modelId: string): string => {
  for (const group of AI_MODEL_GROUPS) {
    const model = group.models.find(m => m.id === modelId);
    if (model) return model.name;
  }
  return modelId;
};

// Helper to format message timestamp
const formatMessageTime = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export function AIAssistantPanel({
  sessionId,
  patientName: _patientName,
  patientId,
  user,
  speakers,
  utterances,
  assignedModule,
  triggerSystemPrompt,
  triggerUserText,
  currentSelectedText,
  onPromptSent,
  onAssignModule: _onAssignModule,
  onTextSelection,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenMusicModal,
  onOpenSceneGeneration,
  onLibraryRefresh,
  onClose: _onClose,
  onJumpToTimestamp,
}: AIAssistantPanelProps) {
  // Get dbUser for avatar
  const { dbUser } = useAuth();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>>([]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(10); // Pagination state
  const [isLoading, setIsLoading] = useState(false);
  const [_isLoadingHistory, _setIsLoadingHistory] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash'); // Default to Gemini for better context handling
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [hoveredPromptId, setHoveredPromptId] = useState<string | null>(null);
  const [showParticipantDropdown, setShowParticipantDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [isLoadingModules, setIsLoadingModules] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('all');
  const [showModuleSelectorModal, setShowModuleSelectorModal] = useState(false);
  const [moduleSelectionCallback, setModuleSelectionCallback] = useState<((moduleId: string) => void) | null>(null);
  // Save Note Modal state
  const [showSaveNoteModal, setShowSaveNoteModal] = useState(false);
  const [selectedTextForNote, setSelectedTextForNote] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteTags, setNoteTags] = useState<string[]>([]);
  // Save Quote Modal state
  const [showSaveQuoteModal, setShowSaveQuoteModal] = useState(false);
  const [selectedTextForQuote, setSelectedTextForQuote] = useState('');
  // AI Quote Extractor Modal state
  const [showAIQuoteExtractorModal, setShowAIQuoteExtractorModal] = useState(false);
  const [aiQuoteExtractorContent, setAIQuoteExtractorContent] = useState('');
  // Patients list for modals
  const [sessionPatients, setSessionPatients] = useState<PatientOption[]>([]);
  // Clear Chat confirmation
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  // Prompt Library Modal state
  const [showPromptLibraryModal, setShowPromptLibraryModal] = useState(false);
  const [showCreatePromptModal, setShowCreatePromptModal] = useState(false);
  const [showEditPromptModal, setShowEditPromptModal] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<ModuleAiPrompt | null>(null);
  // Message Preview Modal state
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const [previewTimestamp, setPreviewTimestamp] = useState<Date | null>(null);
  // Bulk Save Quotes Modal state
  const [showBulkSaveQuotesModal, setShowBulkSaveQuotesModal] = useState(false);
  const [bulkQuotes, setBulkQuotes] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  // Automatic retry tracking for malformed JSON
  const currentRetryCountRef = useRef<number>(0);
  const MAX_AUTO_RETRY = 3;

  // Module selector callback
  const handleOpenModuleSelector = (options: { onModuleSelected: (moduleId: string) => void }) => {
    setModuleSelectionCallback(() => options.onModuleSelected);
    setShowModuleSelectorModal(true);
  };

  const handleModuleSelected = (moduleId: string) => {
    if (moduleSelectionCallback) {
      moduleSelectionCallback(moduleId);
      setModuleSelectionCallback(null);
    }
  };

  const handleCloseModuleSelector = () => {
    setShowModuleSelectorModal(false);
    setModuleSelectionCallback(null);
  };

  // Save Note Modal handlers
  const handleOpenSaveNoteModal = (content: string) => {
    // Convert markdown to HTML before storing
    const htmlContent = markdownToHTML(content);
    setSelectedTextForNote(htmlContent);
    setNoteTitle('');
    setNoteTags([]);
    setShowSaveNoteModal(true);
  };

  /**
   * Save Note Modal handler for JSON output (with pre-filled data from AI)
   *
   * DATA FORMAT: AI returns markdown, but we need HTML for TipTap editor and database
   * - AI response: markdown (e.g., "**bold**")
   * - TipTap editor: HTML (e.g., "<strong>bold</strong>")
   * - Database: HTML (stored in notes.content)
   */
  const handleOpenSaveNoteModalFromJSON = (data: { title: string; content: string; tags?: string[] }) => {
    // CRITICAL: Convert markdown (from AI) → HTML (for TipTap + database)
    const htmlContent = markdownToHTML(data.content);
    setSelectedTextForNote(htmlContent);
    setNoteTitle(data.title);
    setNoteTags(data.tags || []);
    setShowSaveNoteModal(true);
  };

  const handleCloseSaveNoteModal = () => {
    setShowSaveNoteModal(false);
    setSelectedTextForNote('');
    setNoteTitle('');
    setNoteTags([]);
  };

  /**
   * Saves note to database
   *
   * DATA FORMAT: Content is already HTML at this point
   * - Received from TipTap editor as HTML
   * - Stored in database as HTML
   * - No conversion needed here
   */
  const handleSaveNote = async (noteData: { patientId?: string; title: string; content: string; tags: string[] }) => {
    // patientId comes from the modal's patient selector
    const patientId = noteData.patientId;

    if (!patientId) {
      throw new Error('Please select a patient to save this note.');
    }

    // Save the note (content is already HTML from TipTap editor)
    const response = await authenticatedPost('/api/notes', user, {
      patientId,
      sessionId,
      title: noteData.title,
      content: noteData.content, // HTML format - stored directly
      tags: noteData.tags,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to save note. Please try again.';
      throw new Error(errorMessage);
    }

    // Refresh library if callback exists
    if (onLibraryRefresh) {
      onLibraryRefresh();
    }
  };

  // Save Quote Modal handlers
  const handleCloseSaveQuoteModal = () => {
    setShowSaveQuoteModal(false);
    setSelectedTextForQuote('');
  };

  // AI Quote Extractor Modal handlers
  const handleOpenAIQuoteExtractor = (content: string) => {
    setAIQuoteExtractorContent(content);
    setShowAIQuoteExtractorModal(true);
  };

  const handleCloseAIQuoteExtractor = () => {
    setShowAIQuoteExtractorModal(false);
    setAIQuoteExtractorContent('');
  };

  const handleSaveExtractedQuotes = async (quotes: Array<{
    patientId: string;
    quoteText: string;
    speaker: string;
    startTimeSeconds?: number;
    endTimeSeconds?: number;
  }>) => {
    // Save all quotes
    for (const quoteData of quotes) {
      const response = await authenticatedPost('/api/quotes', user, {
        patientId: quoteData.patientId,
        sessionId,
        quoteText: quoteData.quoteText,
        speaker: quoteData.speaker,
        startTimeSeconds: quoteData.startTimeSeconds,
        endTimeSeconds: quoteData.endTimeSeconds,
        source: 'ai_conversation',
        validateAgainstTranscript: false, // Don't require verbatim match for AI-extracted quotes
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save quote');
      }
    }

    // Refresh library
    if (onLibraryRefresh) {
      onLibraryRefresh();
    }
  };

  const handleSaveQuote = async (quoteData: { patientId: string; quoteText: string; speaker: string }) => {
    // Save the quote with validation against transcript
    const response = await authenticatedPost('/api/quotes', user, {
      patientId: quoteData.patientId,
      sessionId,
      quoteText: quoteData.quoteText,
      speaker: quoteData.speaker,
      source: 'ai_conversation',
      validateAgainstTranscript: true, // Require verbatim match for clinical accuracy
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Handle specific validation errors
      if (errorData.code === 'QUOTE_NOT_IN_TRANSCRIPT') {
        throw new Error('This quote does not match the transcript verbatim. For clinical accuracy, quotes must be exact excerpts from the session transcript.');
      }

      throw new Error(errorData.error || 'Failed to save quote');
    }

    // Refresh library if callback exists
    if (onLibraryRefresh) {
      onLibraryRefresh();
    }
  };

  // Message Preview Modal handlers
  const handleOpenPreviewModal = (content: string, timestamp: Date) => {
    setPreviewContent(content);
    setPreviewTimestamp(timestamp);
    setShowPreviewModal(true);
  };

  const handleClosePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewContent('');
    setPreviewTimestamp(null);
  };

  // Download handler
  const handleDownloadMessage = async (content: string) => {
    const plainText = stripMarkdownForPlainText(content);
    downloadAsTextFile(plainText, 'clinical-note');
  };

  // Bulk Save Quotes Modal handlers
  const handleOpenBulkSaveQuotesModal = (quotes: any[]) => {
    setBulkQuotes(quotes);
    setShowBulkSaveQuotesModal(true);
  };

  const handleCloseBulkSaveQuotesModal = () => {
    setShowBulkSaveQuotesModal(false);
    setBulkQuotes([]);
  };

  const handleBulkSaveQuotes = async (quotePatientMappings: QuoteWithPatient[]) => {
    try {
      const response = await Promise.all(
        quotePatientMappings.map(({ quoteIndex, patientId }) => {
          const quote = bulkQuotes[quoteIndex];
          return authenticatedPost('/api/quotes', user, {
            patientId, // Per-quote patient ID
            sessionId,
            quoteText: quote.quote_text || quote.text,
            speaker: quote.speaker || 'Unknown',
            tags: quote.tags || [],
            notes: quote.context || quote.significance || '',
            // Pass timestamps if available (from AI extraction)
            startTimeSeconds: quote.start_time_seconds ?? quote.timestamp?.start,
            endTimeSeconds: quote.end_time_seconds ?? quote.timestamp?.end,
          });
        }),
      );

      const successCount = response.filter(r => r.ok).length;

      // Refresh library if callback exists
      if (onLibraryRefresh) {
        onLibraryRefresh();
      }

      alert(`Saved ${successCount}/${bulkQuotes.length} quotes successfully.`);
    }
    catch (error) {
      console.error('Error saving quotes:', error);
      throw error;
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Close input area dropdowns
      if (inputContainerRef.current && !inputContainerRef.current.contains(target)) {
        setShowParticipantDropdown(false);
        setShowPromptDropdown(false);
      }
      // Close header model dropdown
      if (headerRef.current && !headerRef.current.contains(target)) {
        setShowModelDropdown(false);
      }
      // Close module dropdown
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(target)) {
        setShowModuleDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic AI Prompts system
  const [modulePrompts, setModulePrompts] = useState<AIPromptOption[]>([]); // Module-linked prompts
  const [libraryPrompts, setLibraryPrompts] = useState<AIPromptOption[]>([]); // Library prompts
  const [_moduleAiPromptText, setModuleAiPromptText] = useState<string | null>(null);
  const [_isLoadingPrompts, setIsLoadingPrompts] = useState(false);
  const [_outputTypeFilter, _setOutputTypeFilter] = useState<'all' | 'text' | 'json'>('all');
  const [_showAllPrompts, _setShowAllPrompts] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [selectedSystemPrompt, setSelectedSystemPrompt] = useState<string | null>(null); // Hidden system prompt
  const [selectedPromptName, setSelectedPromptName] = useState<string | null>(null); // For display when sending without user input

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
            timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
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

  // Load session data to get patients list for modals
  useEffect(() => {
    const fetchSessionPatients = async () => {
      if (!user || !sessionId) return;

      try {
        const response = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
        if (response.ok) {
          const data = await response.json();
          const session = data.session; // API returns { session: { ... } }
          const patients: PatientOption[] = [];

          // Handle individual session with patient
          if (session.patient) {
            patients.push({
              id: session.patient.id,
              name: session.patient.name,
              avatarUrl: session.patient.avatarUrl || null,
            });
          }

          // Handle group session with members
          if (session.group?.members) {
            for (const member of session.group.members) {
              // Avoid duplicates
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
        }
      } catch (error) {
        console.error('Error fetching session patients:', error);
      }
    };

    fetchSessionPatients();
  }, [sessionId, user]);

  // Load AI prompts (module + library)
  useEffect(() => {
    const fetchAiPrompts = async () => {
      if (!user || !sessionId) return;

      try {
        setIsLoadingPrompts(true);

        // 1. Fetch module prompts
        const moduleResponse = await authenticatedFetch(`/api/sessions/${sessionId}/ai-prompts`, user);
        let modulePrompts: AIPromptOption[] = [];
        if (moduleResponse.ok) {
          const moduleData = await moduleResponse.json();
          modulePrompts = moduleData.prompts || [];
          setModulePrompts(modulePrompts);

          // Store module's inline AI prompt text
          if (moduleData.module?.aiPromptText) {
            setModuleAiPromptText(moduleData.module.aiPromptText);
          } else {
            setModuleAiPromptText(null);
          }
        }

        // 2. Fetch all available library prompts
        const libraryResponse = await authenticatedFetch('/api/therapist/prompts', user);
        if (libraryResponse.ok) {
          const libraryData = await libraryResponse.json();
          const allLibraryPrompts = libraryData.prompts || [];

          // 3. Filter out module prompts to avoid duplicates
          const modulePromptIds = new Set(modulePrompts.map(p => p.id));
          const filteredLibraryPrompts = allLibraryPrompts.filter(
            (p: AIPromptOption) => !modulePromptIds.has(p.id),
          );

          setLibraryPrompts(filteredLibraryPrompts);
        }
      } catch (err) {
        console.error('Error fetching AI prompts:', err);
      } finally {
        setIsLoadingPrompts(false);
      }
    };

    fetchAiPrompts();
  }, [sessionId, user, assignedModule]); // Re-fetch when module changes

  // Load available treatment modules
  useEffect(() => {
    const fetchModules = async () => {
      if (!user) return;

      try {
        setIsLoadingModules(true);
        const response = await authenticatedFetch('/api/modules', user);

        if (response.ok) {
          const data = await response.json();
          setAvailableModules(data.modules || []);
        }
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoadingModules(false);
      }
    };

    fetchModules();
  }, [user]);

  // Watch for trigger prompt from analyze modal
  useEffect(() => {
    if (triggerSystemPrompt && triggerUserText) {
      // Set state like the chatbox dropdown does, then trigger send
      // This ensures chat shows only user text, not the system prompt
      setSelectedSystemPrompt(triggerSystemPrompt);
      // Pass system prompt directly to bypass React state timing issue
      // (state update is async, but handleSendMessage runs immediately)
      handleSendMessage(triggerUserText, triggerSystemPrompt);
      onPromptSent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSystemPrompt, triggerUserText]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText?: string, systemPromptOverride?: string | null, isAutoRetry: boolean = false) => {
    const userText = messageText || prompt;

    // Use override if provided (for Analyze mode), otherwise use state
    // This fixes the React state timing issue where state hasn't updated yet
    const effectiveSystemPrompt = systemPromptOverride !== undefined
      ? systemPromptOverride
      : selectedSystemPrompt;

    // Reset retry counter for new user messages (not auto-retries)
    if (!isAutoRetry) {
      currentRetryCountRef.current = 0;
    }

    // CRITICAL FIX: Always include transcript context for free chat
    // Build transcript context based on participant filter
    let transcriptContext = '';
    if (!effectiveSystemPrompt && utterances && utterances.length > 0) {
      let filterId: string | null = null;

      if (selectedParticipant === 'all') {
        filterId = null;
      } else if (selectedParticipant === 'therapist') {
        const therapistUtterance = utterances.find(u => u.speakerType === 'therapist');
        filterId = therapistUtterance?.speakerId || null;
      } else {
        filterId = selectedParticipant;
      }

      // Format and truncate transcript
      const rawTranscript = formatTranscriptForAI(utterances, filterId);
      console.log('[AIAssistantPanel] FREE CHAT - Raw transcript length:', rawTranscript.length);
      transcriptContext = truncateTranscript(rawTranscript, undefined, selectedModel);
      console.log('[AIAssistantPanel] FREE CHAT - Truncated transcript length:', transcriptContext.length);
    }

    // If a system prompt is selected, combine it with user text
    // Format like Analyze modal: promptText + '\n\nSelected text:\n"' + text + '"'
    let fullPrompt = userText;
    if (effectiveSystemPrompt) {
      if (userText.trim()) {
        // Format with "Selected text:" wrapper to match Analyze modal format
        fullPrompt = `${effectiveSystemPrompt}\n\nSelected text:\n"${userText}"`;
      } else {
        // Just the system prompt if no text provided
        fullPrompt = effectiveSystemPrompt;
      }
    } else if (transcriptContext) {
      // For free chat, prepend transcript context to user message
      const participantNote = selectedParticipant === 'all'
        ? 'All Participants'
        : selectedParticipant === 'therapist'
          ? `Therapist (${dbUser?.name || 'You'})`
          : speakers?.find(s => s.id === selectedParticipant)?.name || 'Selected Participant';

      fullPrompt = `**Session Transcript** (${participantNote}):

${transcriptContext}

---

**User Question:**
${userText}`;
    }

    // Add participant filter context to the prompt
    if (selectedParticipant !== 'all') {
      const participantContext = selectedParticipant === 'therapist'
        ? `[Focus your analysis on the therapist's contributions in this session.]`
        : `[Focus your analysis on ${speakers?.find(s => s.id === selectedParticipant)?.name || 'the selected participant'}'s contributions in this session.]`;
      fullPrompt = `${participantContext}\n\n${fullPrompt}`;
    }

    if (!fullPrompt.trim() || isLoading) {
      return;
    }

    // Show descriptive message when prompt is selected but no user text
    const displayMessage = userText.trim()
      ? userText
      : (effectiveSystemPrompt ? `Analyzing with "${selectedPromptName || 'prompt'}"...` : userText);
    const userMessage = { role: 'user' as const, content: displayMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    // Clear parent's selected text state (prompt selection persists)
    onPromptSent();

    try {
      // Send full prompt (with system instructions) to AI
      console.log('[AIAssistantPanel] Sending to API:');
      console.log('[AIAssistantPanel] Model:', selectedModel);
      console.log('[AIAssistantPanel] Total message length:', fullPrompt.length);

      const response = await authenticatedPost('/api/ai/chat', user, {
        messages: [...messages, { role: 'user', content: fullPrompt }],
        sessionId,
        model: selectedModel,
        hasPromptSelected: !!effectiveSystemPrompt, // Flag to skip FREE CHAT system prompt when a prompt is selected
        displayMessage, // Send clean message for database storage (without transcript)
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      const assistantMessage = { role: 'assistant' as const, content: data.message, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMessage]);

      // Check for malformed JSON and auto-retry (2-3 times max)
      if (shouldRetryForMalformedJSON(data.message)) {
        if (currentRetryCountRef.current < MAX_AUTO_RETRY) {
          console.log(`[AIAssistantPanel] Malformed JSON detected - auto-retrying (attempt ${currentRetryCountRef.current + 1}/${MAX_AUTO_RETRY})`);

          // Increment retry count
          currentRetryCountRef.current += 1;

          // Add a system message to inform user about retry
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant' as const,
              content: `_Detected formatting issue. Automatically retrying (attempt ${currentRetryCountRef.current}/${MAX_AUTO_RETRY})..._`,
              timestamp: new Date(),
            },
          ]);

          // Wait a brief moment for UI update, then retry
          setTimeout(() => {
            // Remove both the failed message and the retry notification
            setMessages(prev => prev.slice(0, -2));

            // Re-send the user message (use fullPrompt from above)
            handleSendMessage(userText, effectiveSystemPrompt, true);
          }, 800);
        } else {
          console.warn(`[AIAssistantPanel] Max retry attempts (${MAX_AUTO_RETRY}) reached for malformed JSON`);
          // Reset counter for next request
          currentRetryCountRef.current = 0;
        }
      } else {
        // Successful response - reset counter for next request
        currentRetryCountRef.current = 0;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamplePrompt = (exampleText: string) => {
    handleSendMessage(exampleText);
  };

  // Retry handler for failed JSON responses
  const handleRetry = (actualIndex: number) => {
    // Find the previous user message
    let userMessageIndex = actualIndex - 1;
    while (userMessageIndex >= 0 && messages[userMessageIndex]?.role !== 'user') {
      userMessageIndex--;
    }

    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      if (!userMessage) return;

      // Remove the failed assistant message
      setMessages(prev => prev.filter((_, i) => i !== actualIndex));

      // Re-send the user message
      handleSendMessage(userMessage.content);
    }
  };

  // Textarea handlers for auto-resize and keyboard shortcuts
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '52px'; // Reset to min height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Pagination: Load more messages
  const loadMoreMessages = () => {
    setVisibleMessageCount(prev => prev + 10);
  };

  // Clear all chat messages
  const handleClearChat = async () => {
    if (!sessionId || !user) return;

    setIsClearing(true);
    try {
      const response = await authenticatedFetch(
        `/api/ai/clear-chat?sessionId=${sessionId}`,
        user,
        { method: 'DELETE' },
      );

      if (!response.ok) {
        throw new Error('Failed to clear chat');
      }

      // Clear local state
      setMessages([]);
      setShowClearChatConfirm(false);
    } catch (error) {
      console.error('Error clearing chat:', error);
      alert('Failed to clear chat. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  // Note: filterByOutputType function removed - can be re-added when prompt filtering UI is implemented
  // Filter logic would be: if outputTypeFilter === 'all' return all; else filter by prompt.outputType

  // Handle module assignment - auto-select without modal
  const handleModuleSelection = async (module: any) => {
    try {
      // Show loading state
      setIsLoadingModules(true);

      // Assign module to session via API
      const response = await authenticatedPost(`/api/sessions/${sessionId}/assign-module`, user, {
        moduleId: module.id,
      });

      if (response.ok) {
        // Close dropdown
        setShowModuleDropdown(false);
        // Refresh the page to show updated module
        window.location.reload();
      }
    } catch (error) {
      console.error('Error assigning module:', error);
      setIsLoadingModules(false);
    }
  };

  // Helper to get selected prompt name for display
  const getSelectedPromptName = (): string => {
    if (!selectedPromptId) return 'Prompt';

    // Check module prompts
    const modulePrompt = modulePrompts.find(p => p.id === selectedPromptId);
    if (modulePrompt) return modulePrompt.name;

    // Check library prompts
    const libraryPrompt = libraryPrompts.find(p => p.id === selectedPromptId);
    if (libraryPrompt) return libraryPrompt.name;

    return 'Prompt';
  };

  // Handle prompt selection - prepares prompt for manual Send (user clicks Send button)
  const handlePromptSelection = (promptData: AIPromptOption | { id: string; name: string; prompt: string }) => {
    // Get the system prompt text - prefer systemPrompt field, fallback to promptText for backward compatibility
    const systemPrompt = 'systemPrompt' in promptData && promptData.systemPrompt
      ? promptData.systemPrompt
      : ('promptText' in promptData ? promptData.promptText : promptData.prompt);
    const promptId = promptData.id;

    // Close dropdown immediately for better UX
    setShowPromptDropdown(false);

    // Check if this is a module-linked prompt
    const isModulePrompt = modulePrompts.some(p => p.id === promptId);

    // Combine module's inline prompt with system prompt if it's a module prompt
    let finalSystemPrompt = systemPrompt;
    if (isModulePrompt && _moduleAiPromptText) {
      // Prepend module's inline prompt for module-linked prompts
      finalSystemPrompt = `${_moduleAiPromptText}\n\n---\n\n${systemPrompt}`;
    }

    // Build transcript context based on participant filter
    let transcriptContext = '';
    let participantNote = 'All Participants';

    if (utterances && utterances.length > 0) {
      let filterId: string | null = null;

      if (selectedParticipant === 'all') {
        filterId = null;
        participantNote = 'All Participants';
      } else if (selectedParticipant === 'therapist') {
        // Find therapist speaker ID from utterances
        const therapistUtterance = utterances.find(u => u.speakerType === 'therapist');
        filterId = therapistUtterance?.speakerId || null;
        participantNote = `Therapist (${dbUser?.name || 'You'})`;
      } else {
        // Specific speaker selected
        filterId = selectedParticipant;
        const speaker = speakers?.find(s => s.id === selectedParticipant);
        participantNote = speaker?.name || 'Selected Participant';
      }

      // Format transcript with optional speaker filtering
      const rawTranscript = formatTranscriptForAI(utterances, filterId);

      console.log('[AIAssistantPanel] Selected model:', selectedModel);
      console.log('[AIAssistantPanel] Selected participant:', selectedParticipant);
      console.log('[AIAssistantPanel] Raw transcript length:', rawTranscript.length);

      transcriptContext = truncateTranscript(rawTranscript, undefined, selectedModel);

      console.log('[AIAssistantPanel] Truncated transcript length:', transcriptContext.length);
    } else {
      transcriptContext = '[No transcript available. Please ensure the session has been transcribed.]';
    }

    // Build the full system prompt with transcript context
    let fullSystemPrompt = `${finalSystemPrompt}

---

**Session Transcript** (${participantNote}):

${transcriptContext}`;

    // Append JSON instructions for JSON output prompts with a schema
    if ('outputType' in promptData && promptData.outputType === 'json'
      && 'jsonSchema' in promptData && promptData.jsonSchema) {
      const schema = promptData.jsonSchema as Record<string, unknown>;

      // Extract schemaType from jsonSchema if available
      const schemaType = (schema as Record<string, unknown>)?.schemaType as string
        || ((schema as Record<string, unknown>)?.properties as Record<string, unknown>)?.schemaType
        && (((schema as Record<string, unknown>)?.properties as Record<string, unknown>)?.schemaType as Record<string, unknown>)?.enum
        && ((((schema as Record<string, unknown>)?.properties as Record<string, unknown>)?.schemaType as Record<string, unknown>)?.enum as string[])?.[0]
        || 'structured_output';

      // Build JSON instruction block
      const jsonInstructions = `

---

**CRITICAL JSON OUTPUT REQUIREMENTS:**

You MUST output ONLY valid JSON. Follow these rules exactly:
1. Start your response with { and end with }
2. No explanatory text, markdown, or commentary before or after the JSON
3. The JSON MUST start with "schemaType" as the FIRST field
4. Use this exact schema structure:

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

Example first line: { "schemaType": "${schemaType}", ...

Remember: ONLY output the JSON object. Nothing else.`;

      fullSystemPrompt = fullSystemPrompt + jsonInstructions;
    }

    // Store the prompt for manual Send - user can optionally add text before clicking Send
    setSelectedPromptId(promptId);
    setSelectedPromptName(promptData.name);
    setSelectedSystemPrompt(fullSystemPrompt);
    // Leave input empty - user can optionally type something or just click Send
    setPrompt('');
  };

  // Calculate visible messages (show last N messages)
  const visibleMessages = messages.slice(-visibleMessageCount);
  const hasMoreMessages = messages.length > visibleMessageCount;

  // Get filtered prompts
  // TODO: These will be used when filter UI is implemented
  // const filteredModulePrompts = filterByOutputType(modulePrompts);
  // const filteredLibraryPrompts = filterByOutputType(libraryPrompts);

  // Calculate counts for filter buttons
  // TODO: These will be used when filter UI is implemented
  // const allPromptsCount = modulePrompts.length + libraryPrompts.length;
  // const textOnlyCount = filterByOutputType([...modulePrompts, ...libraryPrompts]).filter(p =>
  //   !p.outputType || p.outputType === 'text'
  // ).length;
  // const jsonOnlyCount = filterByOutputType([...modulePrompts, ...libraryPrompts]).filter(p =>
  //   p.outputType === 'json'
  // ).length;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div ref={headerRef} className="flex-shrink-0 border-b border-gray-200 bg-white px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-[#111827]">AI Assistant</h2>
            {/* AI Model Dropdown with Grouped Options */}
            <div className="relative">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                {getModelDisplayName(selectedModel)}
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </button>
              {showModelDropdown && (
                <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {AI_MODEL_GROUPS.map(group => (
                    <div key={group.provider}>
                      <div className="px-3 py-1.5 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                        {group.provider}
                      </div>
                      {group.models.map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left text-sm transition-colors hover:bg-gray-100 ${
                            selectedModel === model.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                          }`}
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Clear Chat Button */}
            <button
              onClick={() => setShowClearChatConfirm(true)}
              disabled={messages.length === 0}
              className="flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              title="Clear all chat messages"
            >
              <Trash2 className="h-3 w-3" />
              Clear Chat
            </button>
          </div>
        </div>
      </div>

      {/* Module Selector Row - Compact Inline */}
      <div ref={moduleDropdownRef} className="relative flex-shrink-0 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => setShowModuleDropdown(!showModuleDropdown)}
          disabled={isLoadingModules}
          className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
            assignedModule
              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
              : showModuleDropdown
                ? 'bg-purple-50 text-purple-700'
                : 'bg-white text-gray-700 hover:bg-gray-50'
          } ${isLoadingModules ? 'cursor-not-allowed opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2">
            {isLoadingModules ? (
              <svg className="h-3.5 w-3.5 animate-spin text-purple-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className={`h-3.5 w-3.5 ${assignedModule ? 'text-purple-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
            )}
            <span className="truncate">
              {isLoadingModules ? 'Assigning module...' : assignedModule?.name || 'Select Treatment Module'}
            </span>
          </div>
          {!isLoadingModules && (
            <ChevronDown className={`h-3 w-3 flex-shrink-0 transition-transform ${showModuleDropdown ? 'rotate-180' : ''} ${assignedModule ? 'text-purple-500' : 'text-gray-400'}`} />
          )}
        </button>

        {/* Module Dropdown - Compact Style */}
        {showModuleDropdown && !isLoadingModules && (
          <div className="absolute top-full right-4 left-4 z-50 mt-1 max-h-80 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {availableModules.length === 0 ? (
              <div className="px-3 py-4 text-center">
                <p className="text-xs text-gray-500">No modules available</p>
              </div>
            ) : (
              availableModules.map((module, index) => (
                <button
                  key={module.id}
                  onClick={() => handleModuleSelection(module)}
                  className={`flex w-full items-center justify-between px-3 py-2 text-left transition-colors ${
                    index !== availableModules.length - 1 ? 'border-b border-gray-100' : ''
                  } ${
                    assignedModule?.id === module.id
                      ? 'bg-purple-50 text-purple-700'
                      : 'text-gray-700 hover:bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className={`h-3.5 w-3.5 flex-shrink-0 ${assignedModule?.id === module.id ? 'text-purple-600' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs font-medium">{module.name}</span>
                  </div>
                  {assignedModule?.id === module.id && (
                    <svg className="h-3.5 w-3.5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Chat Messages or Empty State */}
      <div className="flex-1 overflow-y-auto bg-white p-4" onMouseUp={onTextSelection}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="max-w-md text-center">
              {/* Purple Sparkle Icon - Exact Figma Styling */}
              <div
                className="mx-auto mb-6 flex items-center justify-center bg-white"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '10.542px',
                  border: '1.318px solid #f0f0f3',
                  boxShadow: '0px 3px 6px 0px rgba(148, 148, 148, 0.03)',
                }}
              >
                <img src="/assets/icons/stars-02.png" alt="AI Assistant" className="h-12 w-12 object-contain" />
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">Therapeutic Chat Assistant</h3>
              <p className="mb-6 text-sm text-gray-500">
                Ask questions about this session, request insights, or describe what you'd like to visualize.
              </p>

              {/* Prompt Suggestion Buttons - Exact Figma Styling */}
              <div className="space-y-3">
                <button
                  onClick={() => handleExamplePrompt('What are the key themes?')}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white text-left text-sm font-normal text-gray-900 transition-colors hover:border-purple-300 hover:bg-purple-50"
                  style={{
                    padding: '15px',
                    boxShadow: '0px 3px 5px 0px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img src="/assets/icons/star-04.png" alt="" className="h-4 w-4 flex-shrink-0" />
                  <span>What are the key themes?</span>
                </button>
                <button
                  onClick={() => handleExamplePrompt('How is the patient progressing?')}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white text-left text-sm font-normal text-gray-900 transition-colors hover:border-purple-300 hover:bg-purple-50"
                  style={{
                    padding: '15px',
                    boxShadow: '0px 3px 5px 0px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img src="/assets/icons/star-04.png" alt="" className="h-4 w-4 flex-shrink-0" />
                  <span>How is the patient progressing?</span>
                </button>
                <button
                  onClick={() => handleExamplePrompt('Visualize the patient\'s metaphor')}
                  className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white text-left text-sm font-normal text-gray-900 transition-colors hover:border-purple-300 hover:bg-purple-50"
                  style={{
                    padding: '15px',
                    boxShadow: '0px 3px 5px 0px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <img src="/assets/icons/star-04.png" alt="" className="h-4 w-4 flex-shrink-0" />
                  <span>Visualize the patient's metaphor</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load More Button */}
            {hasMoreMessages && (
              <div className="flex items-center justify-center pb-4">
                <button
                  onClick={loadMoreMessages}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Load More Previous Messages
                  <span className="ml-1 text-xs text-gray-400">
                    (Showing
                    {' '}
                    {visibleMessages.length}
                    {' '}
                    of
                    {' '}
                    {messages.length}
                    )
                  </span>
                </button>
              </div>
            )}

            {visibleMessages.map((message, index) => {
              // Detect JSON in assistant messages
              const jsonData = message.role === 'assistant' ? detectAndExtractJSON(message.content) : null;
              // Calculate actual index in full messages array for retry functionality
              const actualMessageIndex = messages.length - visibleMessages.length + index;

              return (
                <div
                  key={index}
                  className={`group relative ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}
                >
                  {/* Message Content */}
                  <div
                    className={`relative ${message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
                  >
                    {/* User/Assistant Label with Timestamp */}
                    <div className="mb-1.5 flex items-center gap-2 px-1">
                      {message.role === 'assistant' ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-600 to-purple-600">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">AI Assistant</span>
                          <span className="text-[10px] text-gray-400">{formatMessageTime(message.timestamp)}</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-400">{formatMessageTime(message.timestamp)}</span>
                          <span className="text-xs font-semibold text-gray-700">You</span>
                          {dbUser?.avatarUrl ? (
                            <img
                              src={dbUser.avatarUrl}
                              alt="Your avatar"
                              className="h-6 w-6 rounded-md object-cover"
                            />
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-100 text-xs font-medium text-purple-700">
                              {dbUser?.name?.charAt(0) || user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Message Bubble/Card */}
                    <div
                      className={`relative ${
                        message.role === 'user'
                          ? 'rounded-2xl rounded-tr-sm bg-purple-600 px-4 py-3 text-white shadow-lg shadow-purple-600/20'
                          : jsonData
                            ? 'w-full'
                            : 'rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 text-gray-900 shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        jsonData ? (
                          <JSONOutputRenderer
                            jsonData={jsonData}
                            sessionId={sessionId}
                            user={user}
                            patientId={patientId}
                            onActionComplete={(_result) => {
                              if (onLibraryRefresh) {
                                onLibraryRefresh();
                              }
                            }}
                            onProgress={() => {
                              // Progress updates can be handled here if needed
                            }}
                            onRetry={() => handleRetry(actualMessageIndex)}
                            onOpenImageModal={onOpenImageModal}
                            onOpenVideoModal={onOpenVideoModal}
                            onOpenMusicModal={onOpenMusicModal}
                            onOpenSceneGeneration={onOpenSceneGeneration}
                            onOpenModuleSelector={handleOpenModuleSelector}
                            onOpenSaveNoteModal={handleOpenSaveNoteModalFromJSON}
                            onOpenBulkSaveQuotes={handleOpenBulkSaveQuotesModal}
                            onJumpToTimestamp={onJumpToTimestamp}
                          />
                        ) : looksLikeBrokenJSON(message.content) ? (
                          // Show friendly error for broken JSON output
                          <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
                            <span className="text-sm text-amber-700">Output couldn&apos;t be processed correctly.</span>
                            <button
                              type="button"
                              onClick={() => handleRetry(actualMessageIndex)}
                              className="ml-auto flex items-center gap-1.5 rounded-md bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-200"
                            >
                              <RefreshCw className="h-4 w-4" />
                              Retry
                            </button>
                          </div>
                        ) : (
                          <AssistantMessageContent content={message.content} onJumpToTimestamp={onJumpToTimestamp} />
                        )
                      ) : (
                        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>

                    {/* Action Buttons (Non-JSON messages only - Preview, Copy, Download, Save to Notes/Quotes) */}
                    {message.role === 'assistant' && !jsonData && !looksLikeBrokenJSON(message.content) && (
                      <div className="mt-2 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {/* Preview button */}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Preview full message"
                          onClick={() => handleOpenPreviewModal(message.content, message.timestamp)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {/* Copy button */}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Copy message"
                          onClick={() => navigator.clipboard.writeText(message.content)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        {/* Download button */}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Download as text file"
                          onClick={() => handleDownloadMessage(message.content)}
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        {/* Save as Note button */}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Save as Note"
                          onClick={() => handleOpenSaveNoteModal(message.content)}
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {/* Save as Quote button */}
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Extract & Save Quotes"
                          onClick={() => handleOpenAIQuoteExtractor(message.content)}
                        >
                          <Quote className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="mr-12">
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-purple-600 to-purple-600">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">AI Assistant</span>
                </div>

                <div className="inline-flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm">
                  {/* Typing indicator dots */}
                  <div className="animate-typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                  <div className="animate-typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: '200ms' }} />
                  <div className="animate-typing-dot h-2 w-2 rounded-full bg-gray-400" style={{ animationDelay: '400ms' }} />
                </div>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input - Exact Figma Specifications */}
      <div ref={inputContainerRef} className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        {/* Selected Text Context Banner */}
        {selectedPromptId && prompt.trim() && (
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
            <svg className="h-4 w-4 flex-shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-medium text-purple-700">
              Using selected text with &quot;
              {getSelectedPromptName()}
              &quot; prompt
            </span>
            <button
              onClick={() => {
                setSelectedPromptId('');
                setSelectedSystemPrompt(null);
              }}
              className="ml-auto rounded p-0.5 text-purple-400 hover:bg-purple-100 hover:text-purple-600"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Chat Input Area - Exact Figma Styling */}
        <div
          className={`border bg-white ${selectedPromptId && prompt.trim() ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-200'}`}
          style={{
            borderRadius: '16px',
            padding: '16px',
            boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.04)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Chat about the transcript, or select text to begin"
            className="w-full resize-none bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            disabled={isLoading}
            style={{
              minHeight: '48px',
              maxHeight: '120px',
            }}
          />

          {/* Bottom Action Bar */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Participant Filter Button with Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowParticipantDropdown(!showParticipantDropdown);
                    setShowPromptDropdown(false);
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-100"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {selectedParticipant === 'all'
                    ? 'All Participants'
                    : selectedParticipant === 'therapist'
                      ? `${dbUser?.name || 'Therapist'} (You)`
                      : speakers?.find(s => s.id === selectedParticipant)?.name || 'Participant'}
                </button>
                {showParticipantDropdown && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                      Filter by Participant
                    </div>
                    {/* All Participants Option */}
                    <button
                      onClick={() => {
                        setSelectedParticipant('all');
                        setShowParticipantDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                        selectedParticipant === 'all' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      All Participants
                    </button>
                    {/* Therapist (You) Option */}
                    <button
                      onClick={() => {
                        setSelectedParticipant('therapist');
                        setShowParticipantDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                        selectedParticipant === 'therapist' ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                      }`}
                    >
                      {dbUser?.name || 'Therapist'}
                      {' '}
                      (You)
                    </button>
                    {/* Dynamic Speaker Options - deduplicated by name, excluding therapist */}
                    {speakers && speakers.length > 0 && (
                      <>
                        {speakers
                          .filter((speaker, index, self) =>
                            // Deduplicate by name
                            self.findIndex(s => s.name === speaker.name) === index
                            // Exclude therapist (already shown with "(You)")
                            && speaker.name !== dbUser?.name,
                          )
                          .map(speaker => (
                            <button
                              key={speaker.id}
                              onClick={() => {
                                setSelectedParticipant(speaker.id);
                                setShowParticipantDropdown(false);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-purple-50 hover:text-purple-700 ${
                                selectedParticipant === speaker.id ? 'bg-purple-50 text-purple-700' : 'text-gray-700'
                              }`}
                            >
                              {speaker.name}
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt Button with Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setShowPromptDropdown(!showPromptDropdown);
                    setShowParticipantDropdown(false);
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                    selectedPromptId
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : currentSelectedText?.trim()
                        ? 'bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                  title={currentSelectedText?.trim() ? 'Text selected - choose a prompt to analyze' : 'Select a prompt'}
                >
                  {currentSelectedText?.trim() && !selectedPromptId && (
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  )}
                  {selectedPromptId && (
                    <svg className="h-4 w-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                  {getSelectedPromptName()}
                </button>
                {showPromptDropdown && (
                  <div className="absolute bottom-full left-0 z-50 mb-2 max-h-96 w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {/* Module Prompts - Show FIRST when a module is selected */}
                    {modulePrompts.length > 0 && (
                      <>
                        <div className="border-b border-purple-100 bg-purple-50 px-3 py-2 text-xs font-semibold tracking-wide text-purple-600 uppercase">
                          <span className="flex items-center gap-1.5">
                            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            Module Prompts
                          </span>
                        </div>
                        {modulePrompts.map(p => (
                          <div key={p.id} className="relative">
                            <button
                              onClick={() => {
                                handlePromptSelection(p);
                                setShowPromptDropdown(false);
                              }}
                              onMouseEnter={() => setHoveredPromptId(p.id)}
                              onMouseLeave={() => setHoveredPromptId(null)}
                              className={`w-full border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                                selectedPromptId === p.id
                                  ? 'border-purple-600 bg-purple-100 text-purple-700'
                                  : 'border-purple-400 text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                            >
                              <span className="font-medium">{p.name}</span>
                              {p.description && (
                                <span className="block truncate text-xs text-gray-500">{p.description}</span>
                              )}
                            </button>

                            {/* Tooltip on Hover */}
                            {hoveredPromptId === p.id && p.description && (
                              <div className="absolute top-0 left-full z-50 ml-2 w-72 rounded-lg bg-gray-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl">
                                <p className="mb-1 font-medium">{p.name}</p>
                                <p className="text-gray-300">{p.description}</p>
                                {/* Arrow pointing left */}
                                <div className="absolute top-3 right-full h-0 w-0 border-[6px] border-transparent border-r-gray-900" />
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                    {/* Library Prompts */}
                    {libraryPrompts.length > 0 && (
                      <>
                        <div className="mt-1 border-t border-gray-100 px-3 py-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                          Library Prompts
                        </div>
                        {libraryPrompts.map(p => (
                          <div key={p.id} className="relative">
                            <button
                              onClick={() => {
                                handlePromptSelection(p);
                                setShowPromptDropdown(false);
                              }}
                              onMouseEnter={() => setHoveredPromptId(p.id)}
                              onMouseLeave={() => setHoveredPromptId(null)}
                              className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                                selectedPromptId === p.id
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                            >
                              <span className="font-medium">{p.name}</span>
                            </button>

                            {/* Tooltip on Hover */}
                            {hoveredPromptId === p.id && p.description && (
                              <div className="absolute top-0 left-full z-50 ml-2 w-72 rounded-lg bg-gray-900 px-3 py-2.5 text-xs leading-relaxed text-white shadow-xl">
                                <p className="mb-1 font-medium">{p.name}</p>
                                <p className="text-gray-300">{p.description}</p>
                                {/* Arrow pointing left */}
                                <div className="absolute top-3 right-full h-0 w-0 border-[6px] border-transparent border-r-gray-900" />
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Gear Button for Prompt Library */}
              <button
                type="button"
                onClick={() => setShowPromptLibraryModal(true)}
                className="flex items-center justify-center rounded-lg bg-white p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                title="Manage Prompts"
              >
                <Settings className="h-4 w-4" />
              </button>

            </div>

            {/* Send Button - Black Circle with Up Arrow (Exact Figma: 32x32px) */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!prompt.trim() && !selectedSystemPrompt)}
              className="flex items-center justify-center rounded-full bg-gray-900 text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
              style={{
                width: '32px',
                height: '32px',
              }}
              title={prompt.trim() ? 'Send message' : 'Type a message'}
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Module Selector Modal */}
      <ModuleSelectorModal
        user={user}
        isOpen={showModuleSelectorModal}
        onModuleSelected={handleModuleSelected}
        onClose={handleCloseModuleSelector}
      />

      {/* Save Note Modal */}
      <SaveNoteModal
        isOpen={showSaveNoteModal}
        onClose={handleCloseSaveNoteModal}
        selectedText={selectedTextForNote}
        patients={sessionPatients}
        initialTitle={noteTitle}
        initialTags={noteTags}
        onSave={handleSaveNote}
      />

      {/* Save Quote Modal */}
      <SaveQuoteModal
        isOpen={showSaveQuoteModal}
        onClose={handleCloseSaveQuoteModal}
        selectedText={selectedTextForQuote}
        patients={sessionPatients}
        onSave={handleSaveQuote}
      />

      {/* AI Quote Extractor Modal */}
      <AIQuoteExtractorModal
        isOpen={showAIQuoteExtractorModal}
        onClose={handleCloseAIQuoteExtractor}
        messageContent={aiQuoteExtractorContent}
        patients={sessionPatients}
        sessionId={sessionId}
        onSave={handleSaveExtractedQuotes}
        onJumpToTimestamp={onJumpToTimestamp}
      />

      {/* Clear Chat Confirmation Modal */}
      <Modal
        isOpen={showClearChatConfirm}
        onClose={() => setShowClearChatConfirm(false)}
        title="Clear All Chat Messages?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This will permanently delete all chat messages for this session. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowClearChatConfirm(false)}
              disabled={isClearing}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleClearChat}
              disabled={isClearing}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isClearing ? 'Clearing...' : 'Clear All Messages'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Prompt Library Modal */}
      <Modal
        isOpen={showPromptLibraryModal}
        onClose={() => setShowPromptLibraryModal(false)}
        title="Prompt Library"
        size="2xl"
      >
        <PromptLibrary
          onSelectPrompt={(prompt) => {
            setShowPromptLibraryModal(false);
            // Convert ModuleAiPrompt to AIPromptOption format and execute
            handlePromptSelection({
              id: prompt.id,
              name: prompt.name,
              systemPrompt: prompt.promptText,
              promptText: prompt.promptText,
              description: prompt.description,
              category: prompt.category || 'analysis',
              icon: prompt.icon || 'sparkles',
              outputType: prompt.outputType as 'text' | 'json',
              jsonSchema: prompt.jsonSchema as Record<string, unknown> | null,
            });
          }}
          onAddClick={() => {
            setShowCreatePromptModal(true);
          }}
          onEditClick={(prompt) => {
            setEditingPrompt(prompt);
            setShowEditPromptModal(true);
          }}
          onDeleteClick={async (promptId) => {
            if (confirm('Are you sure you want to delete this prompt?')) {
              try {
                await authenticatedFetch(`/api/prompts/${promptId}`, user, { method: 'DELETE' });
                // PromptLibrary auto-refreshes via its internal fetchPrompts
              } catch (error) {
                console.error('Error deleting prompt:', error);
              }
            }
          }}
        />
      </Modal>

      {/* Create Prompt Modal */}
      {showCreatePromptModal && (
        <CreatePromptModal
          scope="private"
          onClose={() => setShowCreatePromptModal(false)}
          onCreated={() => {
            setShowCreatePromptModal(false);
            // PromptLibrary will auto-refresh
          }}
        />
      )}

      {/* Edit Prompt Modal */}
      {showEditPromptModal && editingPrompt && (
        <EditPromptModal
          promptId={editingPrompt.id}
          onClose={() => {
            setShowEditPromptModal(false);
            setEditingPrompt(null);
          }}
          onUpdated={() => {
            setShowEditPromptModal(false);
            setEditingPrompt(null);
            // PromptLibrary will auto-refresh
          }}
        />
      )}

      {/* Message Preview Modal */}
      <MessagePreviewModal
        isOpen={showPreviewModal}
        onClose={handleClosePreviewModal}
        content={previewContent}
        timestamp={previewTimestamp || undefined}
        onDownload={() => handleDownloadMessage(previewContent)}
      />

      {/* Bulk Save Quotes Modal */}
      <BulkSaveQuotesModal
        isOpen={showBulkSaveQuotesModal}
        onClose={handleCloseBulkSaveQuotesModal}
        quotes={bulkQuotes}
        patients={sessionPatients}
        onSave={handleBulkSaveQuotes}
      />
    </div>
  );
}
