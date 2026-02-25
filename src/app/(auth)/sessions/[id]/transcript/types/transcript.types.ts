/**
 * Shared types for Transcript Viewer components
 */

import type { User } from 'firebase/auth';
import type { AIPromptOption } from '@/components/sessions/AnalyzeSelectionModal';
import type { TreatmentModule } from '@/models/Schema';

export type Utterance = {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerType: 'therapist' | 'patient' | 'group_member';
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  avatarUrl?: string;
  referenceImageUrl?: string;
};

export type { AIPromptOption };

// Speaker info for displaying in header
export type SpeakerInfo = {
  id: string;
  name: string;
  type: 'therapist' | 'patient' | 'group_member';
  avatarUrl?: string;
  referenceImageUrl?: string;
  initial?: string;
};

// Patient info for session header display
export type SessionPatient = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

// Data passed when saving a quote from transcript selection
export type SaveQuoteData = {
  selectedText: string;
  speakerName: string;
  speakerId: string;
  speakerType: 'therapist' | 'patient' | 'group_member';
  startTime: number;
  endTime: number;
};

// Props for TranscriptPanel
export type TranscriptPanelProps = {
  sessionId: string;
  sessionTitle: string;
  utterances: Utterance[];
  audioUrl?: string;
  onTextSelection: () => void;
  onSaveQuote?: (data: SaveQuoteData) => void; // Save quote from floating menu
  user: User | null;
  // Real session data (not hardcoded)
  groupName?: string;
  sessionDate?: string;
  speakers?: SpeakerInfo[];
  // Session patients for header display (from session.patient or session.group.members)
  sessionPatients?: SessionPatient[];
  // Callback for speaker reassignment
  onSpeakerReassign?: (utteranceId: string, newSpeakerId: string) => Promise<void>;
  // Collapse functionality
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  // External seek control - when this value changes, seek audio to this timestamp
  seekToTimestamp?: number | null;
  onSeekComplete?: () => void; // Called after seek is performed to reset the value
  // Pre-loaded audio duration from database (fallback when browser events fail)
  audioDurationSeconds?: number;
  // Open analyze modal from floating menu
  onOpenAnalyzeModal?: () => void;
  // Speaker labeling modal
  onOpenSpeakerLabeling?: () => void;
  // Archive state
  isArchived?: boolean;
};

// Props for AIAssistantPanel
export type AIAssistantPanelProps = {
  sessionId: string;
  patientName: string;
  patientId?: string; // Patient ID for saving quotes/notes
  user: User | null;
  speakers?: SpeakerInfo[];
  utterances?: Utterance[]; // Full transcript for prompt auto-execute with context
  assignedModule: TreatmentModule | null;
  triggerSystemPrompt?: string | null; // System prompt from Analyze Selection modal
  triggerUserText?: string | null; // User's selected text from Analyze Selection modal
  currentSelectedText?: string; // Selected text from transcript for prompt context
  onPromptSent: () => void;
  onAssignModule?: () => void;
  onTextSelection: () => void;
  onOpenImageModal?: (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void;
  onOpenVideoModal?: (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => void;
  onOpenMusicModal?: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void;
  onOpenSceneGeneration?: (data: {
    sceneCard: any; // TherapeuticSceneCard data
  }) => void;
  onLibraryRefresh?: () => void;
  onClose?: () => void;
  onJumpToTimestamp?: (timestamp: number) => void; // Jump to transcript/audio position
  // Archive state
  isArchived?: boolean;
};

// Selected patient info for passing between components
export type SelectedPatientInfo = {
  id: string;
  name: string;
  avatarUrl?: string;
  referenceImageUrl?: string;
};

// Props for LibraryPanel
export type LibraryPanelProps = {
  sessionId: string;
  user: User | null;
  sessionData: any;
  onOpenUpload?: () => void;
  refreshKey: number;
  onTaskComplete?: () => void;
  onClose?: () => void;
  onSelectedPatientChange?: (patient: SelectedPatientInfo | null) => void;
  onOpenGenerateImage?: () => void;
  onOpenGenerateVideo?: () => void;
  onOpenGenerateMusicLyrical?: () => void;
  onOpenGenerateMusicInstrumental?: () => void;
  // Archive state
  isArchived?: boolean;
  // Read-only state (non-owned session after patient reassignment)
  isReadOnly?: boolean;
};

// Props for MediaTab
export type MediaTabProps = {
  sessionId: string;
  user: User | null;
  onOpenUpload?: () => void;
  refreshKey: number;
  mediaFilter?: 'all' | 'videos' | 'images' | 'musics';
  selectedPatient?: string;
  onTaskComplete?: () => void;
  isReadOnly?: boolean;
};

// Props for QuotesTab
export type QuotesTabProps = {
  sessionId: string;
  user: User | null;
  refreshKey?: number;
  selectedPatient?: string;
  onEditQuote?: (quote: any) => void;
  onDeleteQuote?: (quoteId: string) => void;
  onJumpToTimestamp?: (timestamp: number) => void; // Jump to audio position
  isReadOnly?: boolean;
};

// Props for NotesTab
export type NotesTabProps = {
  sessionId: string;
  user: User | null;
  sessionData: any;
  refreshKey?: number;
  selectedPatient?: string;
  isReadOnly?: boolean;
};

// Props for ProfileTab
export type ProfileTabProps = {
  sessionData: any;
  selectedPatient?: string;
};
