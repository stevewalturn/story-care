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
};

export type { AIPromptOption };

// Props for TranscriptPanel
export type TranscriptPanelProps = {
  sessionId: string;
  sessionTitle: string;
  utterances: Utterance[];
  audioUrl?: string;
  onTextSelection: () => void;
  user: User | null;
};

// Props for AIAssistantPanel
export type AIAssistantPanelProps = {
  sessionId: string;
  patientName: string;
  user: User | null;
  assignedModule: TreatmentModule | null;
  triggerPrompt: string | null;
  onPromptSent: () => void;
  onAssignModule: () => void;
  onTextSelection: () => void;
  onOpenImageModal: (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void;
  onOpenVideoModal: (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => void;
  onOpenMusicModal: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void;
  onLibraryRefresh?: () => void;
  analyzeMode: boolean;
  onAnalyzeModeChange: (enabled: boolean) => void;
};

// Props for LibraryPanel
export type LibraryPanelProps = {
  sessionId: string;
  user: User | null;
  sessionData: any;
  onOpenUpload: () => void;
  refreshKey: number;
};

// Props for MediaTab
export type MediaTabProps = {
  sessionId: string;
  user: User | null;
  onOpenUpload: () => void;
  refreshKey: number;
};

// Props for QuotesTab
export type QuotesTabProps = {
  sessionId: string;
  user: User | null;
  refreshKey?: number;
};

// Props for NotesTab
export type NotesTabProps = {
  sessionId: string;
  user: User | null;
  sessionData: any;
  refreshKey?: number;
};

// Props for ProfileTab
export type ProfileTabProps = {
  sessionData: any;
};
