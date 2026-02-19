# Sessions API Reference

## Overview

The Sessions API manages therapy session records including creation, retrieval, audio upload, transcription, speaker diarization, module assignment, AI analysis, and chat. Sessions support both individual and group therapy types. All session data is protected under HIPAA compliance with audit logging.

## Authentication

All endpoints require a valid Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

Role requirements vary by endpoint and are noted below.

## Endpoints

---

### `GET /api/sessions`

**Description**: List all sessions for the authenticated user. Therapists see only their own sessions; org admins and super admins see all sessions. Supports filtering by patient, group, date range, and archive status. Only sessions with completed speaker setup are returned.

**Auth**: Therapist, Org Admin, or Super Admin

**Query Parameters**:

| Param       | Type   | Required | Description                                     |
|-------------|--------|----------|-------------------------------------------------|
| `patientId` | string | No       | Filter by patient (includes group memberships)  |
| `groupId`   | string | No       | Filter by group                                 |
| `startDate` | string | No       | Filter sessions on or after this date            |
| `endDate`   | string | No       | Filter sessions on or before this date           |
| `archived`  | string | No       | Set to `"true"` to show archived sessions only  |

**Response** (200):
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Session Title",
      "sessionDate": "2025-01-15",
      "sessionType": "individual",
      "audioUrl": "https://signed-gcs-url...",
      "audioDurationSeconds": 3600,
      "transcriptionStatus": "completed",
      "patientId": "uuid",
      "groupId": null,
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "lastOpenedAt": "2025-01-16T08:00:00.000Z",
      "archivedAt": null,
      "patient": {
        "id": "uuid",
        "name": "Patient Name",
        "avatarUrl": "https://signed-gcs-url...",
        "referenceImageUrl": "https://signed-gcs-url..."
      },
      "group": null
    }
  ]
}
```

For group sessions, `group` contains:
```json
{
  "group": {
    "id": "uuid",
    "name": "Group Name",
    "members": [
      { "id": "uuid", "name": "Member 1", "avatarUrl": "https://signed-url..." },
      { "id": "uuid", "name": "Member 2", "avatarUrl": null }
    ]
  }
}
```

---

### `POST /api/sessions`

**Description**: Create a new therapy session. For group sessions with multiple patients and no explicit `groupId`, a temporary group is auto-created. Therapists can only create sessions for their assigned patients.

**Auth**: Therapist, Org Admin, or Super Admin

**Request**:
```json
{
  "title": "Session Title",
  "sessionDate": "2025-01-15T10:00:00.000Z",
  "sessionType": "individual",
  "patientIds": ["patient-uuid"],
  "audioUrl": "gcs-path/audio.mp3",
  "groupId": null
}
```

| Field              | Type     | Required | Description                                  |
|--------------------|----------|----------|----------------------------------------------|
| `title`            | string   | Yes      | Session title                                |
| `sessionDate`      | string   | Yes      | ISO date string                              |
| `sessionType`      | string   | No       | `"individual"` or `"group"` (auto-detected)  |
| `patientIds`       | string[] | Yes*     | Patient IDs (* required for individual)      |
| `groupId`          | string   | No       | Explicit group ID for group sessions         |
| `audioUrl`         | string   | Yes      | GCS path to uploaded audio file              |

**Response** (201):
```json
{
  "session": {
    "id": "uuid",
    "title": "Session Title",
    "sessionDate": "2025-01-15",
    "sessionType": "individual",
    "therapistId": "uuid",
    "patientId": "uuid",
    "groupId": null,
    "audioUrl": "gcs-path/audio.mp3",
    "transcriptionStatus": "pending",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### `GET /api/sessions/recent`

**Description**: Get the most recent sessions for the authenticated user. Returns enriched data with patient info and presigned URLs.

**Auth**: Therapist, Org Admin, or Super Admin

**Query Parameters**:

| Param   | Type   | Required | Default | Description               |
|---------|--------|----------|---------|---------------------------|
| `limit` | number | No       | 5       | Max sessions (capped at 20) |

**Response** (200):
```json
{
  "sessions": [
    {
      "id": "uuid",
      "title": "Session Title",
      "sessionDate": "2025-01-15",
      "sessionType": "individual",
      "patientId": "uuid",
      "audioUrl": "https://signed-gcs-url...",
      "transcriptionStatus": "completed",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z",
      "patient": {
        "id": "uuid",
        "name": "Patient Name",
        "email": "patient@example.com",
        "referenceImageUrl": "https://signed-gcs-url..."
      }
    }
  ]
}
```

---

### `GET /api/sessions/[id]`

**Description**: Get a single session with full details including assigned treatment module, patient or group info, and presigned URLs. Updates the `lastOpenedAt` timestamp.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200 - individual session):
```json
{
  "session": {
    "id": "uuid",
    "title": "Session Title",
    "sessionDate": "2025-01-15",
    "sessionType": "individual",
    "audioUrl": "https://signed-gcs-url...",
    "audioDurationSeconds": 3600,
    "transcriptionStatus": "completed",
    "therapistId": "uuid",
    "patientId": "uuid",
    "groupId": null,
    "moduleId": "uuid",
    "moduleName": "CBT Core Module",
    "moduleDomain": "cognitive_behavioral",
    "createdAt": "2025-01-15T10:00:00.000Z",
    "updatedAt": "2025-01-15T10:00:00.000Z",
    "patient": {
      "id": "uuid",
      "name": "Patient Name",
      "email": "patient@example.com",
      "avatarUrl": "https://signed-gcs-url..."
    }
  }
}
```

---

### `PUT /api/sessions/[id]`

**Description**: Update session fields. Only provided fields are updated.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Request**:
```json
{
  "title": "Updated Title",
  "sessionDate": "2025-01-16",
  "audioUrl": "new-gcs-path/audio.mp3",
  "audioDurationSeconds": 4200,
  "transcriptionStatus": "completed"
}
```

All fields are optional. Only provided fields are updated.

**Response** (200):
```json
{
  "session": { "...updated session object..." }
}
```

---

### `DELETE /api/sessions/[id]`

**Description**: Soft-delete a session (HIPAA compliance). Sets `deletedAt` timestamp instead of removing the record.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "success": true
}
```

---

### `POST /api/sessions/[id]/archive`

**Description**: Archive a session. Archived sessions are hidden from the default list view.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "success": true,
  "message": "Session archived"
}
```

**Error** (400):
```json
{
  "error": "Session is already archived"
}
```

---

### `DELETE /api/sessions/[id]/archive`

**Description**: Unarchive (restore) a previously archived session.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "success": true,
  "message": "Session restored from archive"
}
```

---

### Audio Upload

### `POST /api/sessions/upload-url`

**Description**: Generate a signed URL for direct upload to Google Cloud Storage. Bypasses Cloud Run's 32MB request limit. The signed URL is valid for 15 minutes.

**Auth**: Therapist or Admin

**Rate Limit**: Yes (per IP)

**Request**:
```json
{
  "fileName": "recording.mp3",
  "fileType": "audio/mpeg",
  "fileSize": 52428800
}
```

| Field      | Type   | Required | Description                                     |
|------------|--------|----------|-------------------------------------------------|
| `fileName` | string | Yes      | Original file name                              |
| `fileType` | string | Yes      | MIME type (audio/* only)                        |
| `fileSize` | number | No       | File size in bytes (max 500MB)                  |

**Response** (200):
```json
{
  "uploadUrl": "https://storage.googleapis.com/signed-upload-url...",
  "fileId": "uuid",
  "gcsPath": "sessions/user-uid/file-id.mp3",
  "expiresIn": 900
}
```

---

### `POST /api/sessions/upload-confirm`

**Description**: Confirm that a file was successfully uploaded to GCS via signed URL. Creates an audit log entry and returns a presigned URL for preview.

**Auth**: Therapist or Admin

**Request**:
```json
{
  "fileId": "uuid",
  "gcsPath": "sessions/user-uid/file-id.mp3",
  "fileName": "recording.mp3",
  "fileSize": 52428800,
  "sessionId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "fileId": "uuid",
  "gcsPath": "sessions/user-uid/file-id.mp3",
  "url": "https://signed-gcs-url...",
  "message": "Upload confirmed and logged"
}
```

---

### Transcription & Speakers

### `POST /api/sessions/[id]/transcribe`

**Description**: Trigger transcription of session audio via Deepgram. Creates transcript, speaker, and utterance records in the database. Uses the Nova-2 model with speaker diarization.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "transcript": {
    "id": "uuid",
    "sessionId": "uuid",
    "fullText": "Full transcript text...",
    "language": "en",
    "confidence": 0.95
  },
  "speakers": [
    { "id": "uuid", "label": "Speaker 1", "speakerIndex": 0 }
  ],
  "utteranceCount": 42
}
```

---

### `GET /api/sessions/[id]/transcript`

**Description**: Get the transcript for a session, including all utterances ordered by start time.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "transcript": {
    "id": "uuid",
    "sessionId": "uuid",
    "fullText": "Full transcript text...",
    "utterances": [
      {
        "id": "uuid",
        "speakerId": "uuid",
        "text": "Utterance text",
        "startTime": 0.5,
        "endTime": 3.2,
        "confidence": 0.98
      }
    ]
  }
}
```

---

### `POST /api/sessions/[id]/transcript`

**Description**: Create or update a transcript for a session.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Request**:
```json
{
  "fullText": "Complete transcript text...",
  "language": "en"
}
```

**Response** (200/201):
```json
{
  "transcript": { "...transcript object..." }
}
```

---

### `GET /api/sessions/[id]/speakers`

**Description**: Get all speakers for a session, including sample utterances for each.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "speakers": [
    {
      "id": "uuid",
      "label": "Therapist",
      "speakerIndex": 0,
      "assignedUserId": "uuid",
      "sampleUtterances": [
        { "id": "uuid", "text": "Sample text", "startTime": 1.0, "endTime": 4.5 }
      ]
    }
  ]
}
```

---

### `PUT /api/sessions/[id]/speakers`

**Description**: Update speaker assignments (labels and user assignments) for a session.

**Auth**: Therapist (owner), Org Admin, or Super Admin (RBAC enforced)

**Request**:
```json
{
  "speakers": [
    {
      "id": "uuid",
      "label": "Therapist",
      "assignedUserId": "therapist-uuid"
    },
    {
      "id": "uuid",
      "label": "Patient Name",
      "assignedUserId": "patient-uuid"
    }
  ]
}
```

**Response** (200):
```json
{
  "speakers": [ "...updated speaker objects..." ]
}
```

---

### `GET /api/sessions/[id]/speakers/[speakerId]`

**Description**: Get a single speaker's details.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Response** (200):
```json
{
  "speaker": {
    "id": "uuid",
    "label": "Speaker Name",
    "speakerIndex": 0,
    "assignedUserId": "uuid"
  }
}
```

---

### `POST /api/sessions/[id]/speakers/merge`

**Description**: Merge multiple speakers into one. All utterances from source speakers are reassigned to the target speaker, and source speakers are deleted.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Request**:
```json
{
  "targetSpeakerId": "uuid",
  "sourceSpeakerIds": ["uuid1", "uuid2"]
}
```

**Response** (200):
```json
{
  "speaker": { "...merged speaker..." },
  "mergedCount": 2
}
```

---

### `GET /api/sessions/[id]/speakers/[speakerId]/utterances`

**Description**: Get paginated utterances for a specific speaker.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Query Parameters**:

| Param    | Type   | Required | Default | Description          |
|----------|--------|----------|---------|----------------------|
| `page`   | number | No       | 1       | Page number          |
| `limit`  | number | No       | 50      | Items per page       |

**Response** (200):
```json
{
  "utterances": [
    {
      "id": "uuid",
      "text": "Utterance text",
      "startTime": 1.0,
      "endTime": 4.5,
      "confidence": 0.97
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 50
}
```

---

### `PATCH /api/sessions/[id]/speakers/[speakerId]/utterances/[utteranceId]`

**Description**: Reassign an utterance to a different speaker.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Request**:
```json
{
  "speakerId": "new-speaker-uuid"
}
```

**Response** (200):
```json
{
  "utterance": { "...updated utterance..." }
}
```

---

### `GET /api/sessions/[id]/speakers/[speakerId]/audio`

**Description**: Get a presigned audio URL for a specific utterance's audio segment.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Query Parameters**:

| Param         | Type   | Required | Description           |
|---------------|--------|----------|-----------------------|
| `utteranceId` | string | Yes      | Utterance to get audio for |

**Response** (200):
```json
{
  "audioUrl": "https://signed-gcs-url...",
  "startTime": 1.0,
  "endTime": 4.5
}
```

---

### Module & Analysis

### `POST /api/sessions/[id]/assign-module`

**Description**: Assign a treatment module to a session for targeted analysis.

**Auth**: Therapist, Org Admin, or Super Admin (not patients)

**Request**:
```json
{
  "moduleId": "uuid",
  "notes": "Optional assignment notes"
}
```

**Response** (201):
```json
{
  "message": "Module assigned to session successfully",
  "sessionModule": { "...session-module record..." },
  "module": { "...module details..." }
}
```

---

### `POST /api/sessions/[id]/analyze-with-module`

**Description**: Run AI analysis on a session using the assigned module's prompt template. Sends the transcript to the AI model with therapeutic context.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Response** (200):
```json
{
  "analysis": "AI-generated analysis text...",
  "moduleId": "uuid",
  "moduleName": "CBT Core Module"
}
```

---

### Chat & Summary

### `GET /api/sessions/[id]/chat`

**Description**: Get chat message history for a session.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Response** (200):
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "User message...",
      "createdAt": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "AI response...",
      "createdAt": "2025-01-15T10:00:01.000Z"
    }
  ]
}
```

---

### `POST /api/sessions/[id]/chat`

**Description**: Send a message to the AI chat for a session. Includes session transcript context.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Request**:
```json
{
  "message": "What therapeutic themes appear in this session?"
}
```

**Response** (200):
```json
{
  "message": {
    "id": "uuid",
    "role": "assistant",
    "content": "Based on the transcript, I identified several themes..."
  }
}
```

---

### `GET /api/sessions/[id]/summary`

**Description**: Get the AI-generated summary for a session.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Response** (200):
```json
{
  "summary": "Session summary text..."
}
```

---

### `GET /api/sessions/[id]/ai-prompts`

**Description**: Get AI prompts linked to the session's assigned module.

**Auth**: Therapist (owner), Org Admin, or Super Admin

**Response** (200):
```json
{
  "prompts": [
    {
      "id": "uuid",
      "name": "Prompt Name",
      "promptText": "Prompt template...",
      "category": "analysis"
    }
  ]
}
```

## Error Codes

| Status | Description                                   |
|--------|-----------------------------------------------|
| 400    | Invalid request body or parameters            |
| 401    | Missing or invalid authentication token       |
| 403    | Insufficient permissions (RBAC)               |
| 404    | Session or resource not found                 |
| 413    | File too large (upload endpoints)             |
| 429    | Rate limit exceeded (upload endpoints)        |
| 500    | Internal server error                         |
| 503    | Service unavailable (e.g., FFmpeg not found)  |
