export type SessionFormData = {
  title: string;
  sessionDate: string;
  description: string;
  patientIds: string[];
  selectedPatients?: Array<{
    id: string;
    name: string;
    avatarUrl?: string;
    referenceImageUrl?: string;
  }>;
  audioFile: File | null;
  audioUrl?: string;
  audioPath?: string;
  moduleId?: string;
  speakers?: Array<{
    id: string;
    label: string;
    speakerType: string | null;
    speakerName: string | null;
  }>;
  // Voice recording fields
  recordingId?: string;
  recordingLinkId?: string;
  recordingLinkToken?: string;
};
