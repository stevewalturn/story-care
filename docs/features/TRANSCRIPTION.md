# Transcription

## Overview

StoryCare uses Deepgram's Nova-2 model for speech-to-text transcription with automatic speaker diarization. When a therapist triggers transcription, the session audio is sent to Deepgram, which returns a full transcript with speaker labels, word-level timestamps, and confidence scores. The system then creates transcript, speaker, and utterance records in the database. Therapists can label speakers (identifying who is the therapist and who is the patient), merge duplicate speakers, and edit individual utterances.

## User Roles

| Role | Access Level |
|------|-------------|
| Therapist | Triggers transcription, labels speakers, edits utterances, merges speakers |
| Org Admin | Can trigger transcription and view transcripts for org sessions |
| Super Admin | Full access to all transcripts |
| Patient | No direct access to transcripts |

## User Workflow

### Transcription Flow
1. Therapist opens a session that has audio uploaded but no transcript.
2. Therapist clicks "Transcribe" to trigger `POST /api/sessions/[id]/transcribe`.
3. System sets `transcriptionStatus: 'processing'` on the session.
4. System generates a presigned URL for the audio file (1-hour expiry).
5. Audio URL is sent to Deepgram with options: `model: 'nova-2'`, `diarize: true`, `smart_format: true`, `utterances: true`.
6. Deepgram returns the transcript with speaker labels, utterances, and word-level data.
7. System creates a `transcripts` record with the full text.
8. System creates `speakers` records for each unique speaker (e.g., "Speaker 1", "Speaker 2").
9. System bulk-inserts all `utterances` with transcript ID, speaker ID, text, timestamps, and confidence scores.
10. Session is updated with `transcriptionStatus: 'completed'` and `audioDurationSeconds`.

### Speaker Labeling
1. After transcription, speakers are auto-labeled as "Speaker 1", "Speaker 2", etc.
2. Therapist identifies each speaker by reviewing sample utterances.
3. Therapist assigns `speakerType` (therapist/patient/other) and `speakerName` via `PUT /api/sessions/[id]/speakers/[speakerId]`.
4. Once all speakers are labeled, `speakersSetupCompleted` is set to `true` on the session.

### Speaker Merge
1. If Deepgram incorrectly splits one person into multiple speakers, the therapist can merge them.
2. Therapist selects source and target speakers via `POST /api/sessions/[id]/speakers/merge`.
3. All utterances from the source speaker are reassigned to the target speaker.

### Re-Transcription
1. Therapist can re-transcribe a session by triggering transcription again.
2. System deletes existing transcript, speakers, and utterances before creating new ones.

## UI Pages

| Page | Path | Description |
|------|------|-------------|
| Session Detail | `/sessions/[id]` | Transcript view with speaker labels, utterance timeline, and speaker labeling UI |

## API Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/sessions/[id]/transcribe` | Trigger Deepgram transcription for session audio | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/transcript` | Get transcript with speakers and utterances | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/speakers` | List all speakers for a session | Bearer token (therapist+) |
| PUT | `/api/sessions/[id]/speakers/[speakerId]` | Update speaker label, type, and name | Bearer token (therapist+) |
| POST | `/api/sessions/[id]/speakers/merge` | Merge two speakers (reassign utterances) | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/speakers/[speakerId]/utterances` | Get utterances for a specific speaker | Bearer token (therapist+) |
| PUT | `/api/sessions/[id]/speakers/[speakerId]/utterances/[utteranceId]` | Edit utterance text | Bearer token (therapist+) |
| GET | `/api/sessions/[id]/speakers/[speakerId]/audio` | Get audio segment for a speaker | Bearer token (therapist+) |

## Database Tables

| Table | Role in Feature |
|-------|----------------|
| `transcripts` | Full transcript text: `id`, `sessionId`, `fullText`, `createdAt` |
| `speakers` | Identified speakers: `id`, `transcriptId`, `speakerLabel`, `speakerType` (therapist/patient/other), `speakerName`, `totalUtterances`, `totalDurationSeconds` |
| `utterances` | Individual speech segments: `id`, `transcriptId`, `speakerId`, `text`, `startTimeSeconds`, `endTimeSeconds`, `confidenceScore`, `sequenceNumber` |
| `sessions` | `transcriptionStatus` (pending/processing/completed/failed), `audioDurationSeconds`, `speakersSetupCompleted` |

## Key Files

| File | Purpose |
|------|---------|
| `src/libs/Deepgram.ts` | Deepgram client initialization; `transcribeAudio` (URL-based) and `transcribeAudioBuffer` (buffer-based) functions; Langfuse tracing integration for cost tracking |
| `src/app/api/sessions/[id]/transcribe/route.ts` | Transcription orchestration: verifies session access, generates presigned audio URL, calls Deepgram, creates transcript/speakers/utterances records, updates session status |
| `src/app/api/sessions/[id]/transcript/route.ts` | Retrieve transcript with speakers and utterances |
| `src/app/api/sessions/[id]/speakers/route.ts` | List speakers for a session |
| `src/app/api/sessions/[id]/speakers/[speakerId]/route.ts` | Update speaker metadata (label, type, name) |
| `src/app/api/sessions/[id]/speakers/merge/route.ts` | Merge two speakers by reassigning utterances |
| `src/app/api/sessions/[id]/speakers/[speakerId]/utterances/route.ts` | Get utterances for a speaker |
| `src/app/api/sessions/[id]/speakers/[speakerId]/utterances/[utteranceId]/route.ts` | Edit individual utterance text |
| `src/libs/LangfuseTracing.ts` | Observability tracing for transcription API calls |
| `src/utils/TraceMetadataBuilder.ts` | Builds trace metadata with user/session/patient context |

## Technical Notes

- **Deepgram model**: Uses `nova-2` by default, with `smart_format: true` for automatic punctuation and formatting.
- **Speaker diarization**: Enabled by default (`diarize: true`). Deepgram assigns speaker numbers (0, 1, 2...) to utterances; the system maps these to "Speaker 1", "Speaker 2", etc.
- **Bulk insert optimization**: Utterances are bulk-inserted in a single database operation rather than individual inserts. This prevents connection pool exhaustion for sessions with hundreds of utterances.
- **Re-transcription**: Before re-transcribing, existing utterances, speakers, and transcripts are deleted in dependency order (utterances -> speakers -> transcripts).
- **Presigned URL for Deepgram**: The audio file's GCS path is converted to a presigned URL before sending to Deepgram. This allows Deepgram to access the private GCS file.
- **Langfuse tracing**: All transcription calls are traced with Langfuse for cost tracking and observability. Traces include audio duration, model used, utterance count, and error details.
- **HIPAA audit logging**: Transcript creation is logged via `logPHICreate` with session ID, speaker count, utterance count, and duration.
- **Error handling**: If transcription fails, the session's `transcriptionStatus` is set to `failed`. Therapists can retry.
- **Transcription result**: The response includes the transcript record, speakers with sample text (first utterance), and total utterance count.
