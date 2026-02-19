# Recordings API Reference

## Overview

The Recordings API manages audio recording workflows including recording links (shareable URLs for remote recording), uploaded recordings, audio chunk uploads to GCS, recording finalization with Cloud Run merge jobs, and session creation from completed recordings. This API supports both direct in-app recording and remote recording via share links.

## Authentication

All endpoints require a valid Firebase ID token passed via the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

Most endpoints require the `therapist` role (via `requireTherapist`).

## Recording Links

### `GET /api/recording-links`

**Description**: List all recording links created by the authenticated therapist. Links include associated recordings for completed links and automatically detect expired status.

**Auth**: `therapist`

**Query Parameters**:

| Parameter | Type   | Required | Description                                                          |
|-----------|--------|----------|----------------------------------------------------------------------|
| `status`  | string | No       | Filter by status: `pending`, `recording`, `completed`, `expired`, `revoked` |

**Response** (`200 OK`):

```json
{
  "links": [
    {
      "id": "uuid",
      "token": "hex-token-string",
      "sessionTitle": "Session with John",
      "sessionDate": "2026-01-15T10:00:00.000Z",
      "patientIds": ["uuid1", "uuid2"],
      "notes": "Follow-up session",
      "therapistId": "uuid",
      "organizationId": "uuid",
      "status": "pending",
      "expiresAt": "2026-01-16T10:00:00.000Z",
      "expiryDurationMinutes": 1440,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "recording": null
    }
  ]
}
```

---

### `POST /api/recording-links`

**Description**: Create a new recording link with a secure random token. The link can be shared with anyone to record audio remotely.

**Auth**: `therapist`

**Request**:

```json
{
  "sessionTitle": "Session with John",
  "sessionDate": "2026-01-20",
  "patientIds": ["uuid1"],
  "notes": "Follow-up session",
  "expiryDurationMinutes": 1440
}
```

| Field                   | Type     | Required | Description                                 |
|-------------------------|----------|----------|---------------------------------------------|
| `sessionTitle`          | string   | No       | Pre-fill session title                      |
| `sessionDate`           | string   | No       | Pre-fill session date                       |
| `patientIds`            | string[] | No       | Pre-fill patient IDs                        |
| `notes`                 | string   | No       | Notes for the recorder                      |
| `expiryDurationMinutes` | number   | No       | Link validity in minutes (60-10080, default 1440 = 24h) |

**Response** (`201 Created`):

```json
{
  "linkId": "uuid",
  "token": "hex-token-string",
  "shareUrl": "https://app.storycare.com/record/hex-token-string",
  "expiresAt": "2026-01-16T10:00:00.000Z",
  "expiryDurationMinutes": 1440
}
```

---

### `GET /api/recording-links/[id]`

**Description**: Get details for a specific recording link including its share URL and computed expiration status.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Response** (`200 OK`):

```json
{
  "link": {
    "id": "uuid",
    "token": "hex-token-string",
    "shareUrl": "https://app.storycare.com/record/hex-token-string",
    "status": "pending",
    "sessionTitle": "Session with John",
    "expiresAt": "2026-01-16T10:00:00.000Z"
  }
}
```

---

### `DELETE /api/recording-links/[id]`

**Description**: Revoke a recording link. Completed links cannot be revoked.

**Auth**: Owning `therapist`, `super_admin`

**Response** (`200 OK`):

```json
{
  "success": true
}
```

**Error Responses**:

- `400`: Cannot revoke a completed recording link
- `404`: Recording link not found
- `403`: Forbidden

---

## Uploaded Recordings

### `GET /api/recordings`

**Description**: List all recordings for the authenticated therapist. Includes presigned audio URLs and chunk counts.

**Auth**: `therapist`

**Query Parameters**:

| Parameter | Type   | Required | Description                                                            |
|-----------|--------|----------|------------------------------------------------------------------------|
| `status`  | string | No       | Filter: `recording`, `uploading`, `merging`, `completed`, `failed`, `used` |
| `source`  | string | No       | Filter: `direct`, `share_link`                                         |

**Response** (`200 OK`):

```json
{
  "recordings": [
    {
      "id": "uuid",
      "source": "direct",
      "recordingLinkId": null,
      "title": "Recording 1/15/2026",
      "recordedAt": "2026-01-15T10:00:00.000Z",
      "finalAudioUrl": "recordings/uuid/merged.webm",
      "audioUrl": "https://storage.googleapis.com/signed-url...",
      "totalDurationSeconds": 3600,
      "totalFileSizeBytes": 52428800,
      "status": "completed",
      "sessionId": null,
      "deviceInfo": { "browser": "Chrome", "os": "macOS" },
      "chunksCount": 5,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/recordings`

**Description**: Create a new recording entry to track an in-progress recording.

**Auth**: `therapist`

**Request**:

```json
{
  "source": "direct",
  "recordingLinkId": null,
  "title": "Morning session",
  "deviceInfo": {
    "browser": "Chrome",
    "os": "macOS"
  }
}
```

| Field             | Type   | Required | Description                                  |
|-------------------|--------|----------|----------------------------------------------|
| `source`          | string | No       | `direct` (default) or `share_link`           |
| `recordingLinkId` | UUID   | No       | Associated recording link ID (for share_link)|
| `title`           | string | No       | Recording title                              |
| `deviceInfo`      | object | No       | Device/browser metadata                      |

**Response** (`201 Created`):

```json
{
  "recordingId": "uuid"
}
```

---

### `GET /api/recordings/[id]`

**Description**: Get details for a specific recording with a presigned audio URL.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Response** (`200 OK`):

```json
{
  "recording": {
    "id": "uuid",
    "source": "direct",
    "title": "Morning session",
    "status": "completed",
    "audioUrl": "https://storage.googleapis.com/signed-url...",
    "totalDurationSeconds": 3600,
    "totalFileSizeBytes": 52428800
  }
}
```

---

### `DELETE /api/recordings/[id]`

**Description**: Delete a recording. Cannot delete recordings that have been used to create a session.

**Auth**: Owning `therapist`, `super_admin`

**Response** (`200 OK`):

```json
{
  "success": true
}
```

**Error Responses**:

- `400`: Cannot delete recording that has been used to create a session
- `404`: Recording not found
- `403`: Forbidden

---

### `POST /api/recordings/[id]/chunks`

**Description**: Two-phase chunk upload: (1) request a signed upload URL, or (2) confirm a chunk was uploaded. Use `?confirm=true` query parameter for the confirmation phase.

**Auth**: Owning `therapist`

**Phase 1 - Request Upload URL**:

```json
{
  "chunkIndex": 0,
  "mimeType": "audio/webm",
  "extension": "webm"
}
```

**Response** (`200 OK`):

```json
{
  "uploadUrl": "https://storage.googleapis.com/signed-upload-url...",
  "gcsPath": "recordings/uuid/chunk-0.webm",
  "expiresIn": 900
}
```

**Phase 2 - Confirm Upload** (`POST /api/recordings/[id]/chunks?confirm=true`):

```json
{
  "chunkIndex": 0,
  "gcsPath": "recordings/uuid/chunk-0.webm",
  "durationSeconds": 30,
  "sizeBytes": 524288,
  "isFinal": false
}
```

**Response** (`200 OK`):

```json
{
  "success": true,
  "chunkIndex": 0,
  "totalChunks": 1,
  "totalDurationSeconds": 30
}
```

---

### `GET /api/recordings/[id]/chunks`

**Description**: List all uploaded chunks for a recording.

**Auth**: `therapist`

**Response** (`200 OK`):

```json
{
  "chunks": [
    {
      "chunkIndex": 0,
      "gcsPath": "recordings/uuid/chunk-0.webm",
      "durationSeconds": 30,
      "sizeBytes": 524288,
      "uploadedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "totalDurationSeconds": 30,
  "totalFileSizeBytes": 524288
}
```

---

### `POST /api/recordings/[id]/finalize`

**Description**: Mark a recording as complete. For single-chunk recordings, sets the final audio URL directly. For multi-chunk recordings, triggers a Cloud Run merge job. Falls back to folder-path storage if Cloud Run is unavailable.

**Auth**: Owning `therapist`

**Request**:

```json
{
  "totalDurationSeconds": 3600
}
```

**Response** (`200 OK`) - Single chunk:

```json
{
  "success": true,
  "recordingId": "uuid",
  "status": "completed",
  "totalDurationSeconds": 3600,
  "totalFileSizeBytes": 52428800,
  "chunksCount": 1
}
```

**Response** (`200 OK`) - Multi-chunk (merge triggered):

```json
{
  "success": true,
  "recordingId": "uuid",
  "status": "merging",
  "jobId": "uuid",
  "totalDurationSeconds": 3600,
  "totalFileSizeBytes": 52428800,
  "chunksCount": 5,
  "message": "Audio chunks are being merged. This may take a moment."
}
```

---

### `POST /api/recordings/[id]/stop`

**Description**: Stop a recording in progress and finalize it with whatever chunks have been uploaded so far. Only recordings with `recording` or `uploading` status can be stopped.

**Auth**: Owning `therapist`

**Response** (`200 OK`):

```json
{
  "success": true,
  "recordingId": "uuid",
  "status": "merging",
  "jobId": "uuid",
  "totalDurationSeconds": 1800,
  "totalFileSizeBytes": 26214400,
  "chunksCount": 3,
  "message": "Recording stopped. Audio chunks are being merged."
}
```

**Error Responses**:

- `400`: Cannot stop recording with current status

---

### `GET /api/recordings/[id]/merge-status`

**Description**: Poll the status of an audio merge job for a recording. Returns job progress, status, and presigned audio URL when complete.

**Auth**: Owning `therapist`

**Response** (`200 OK`) - Merge in progress:

```json
{
  "recordingId": "uuid",
  "recordingStatus": "merging",
  "jobId": "uuid",
  "jobStatus": "processing",
  "progress": 50,
  "currentStep": "Merging chunk 3 of 5",
  "startedAt": "2026-01-15T10:01:00.000Z",
  "message": "Merging audio: Merging chunk 3 of 5"
}
```

**Response** (`200 OK`) - Merge completed:

```json
{
  "recordingId": "uuid",
  "recordingStatus": "completed",
  "jobId": "uuid",
  "jobStatus": "completed",
  "progress": 100,
  "audioUrl": "https://storage.googleapis.com/signed-url...",
  "completedAt": "2026-01-15T10:05:00.000Z",
  "message": "Audio merge completed successfully"
}
```

---

### `POST /api/recordings/[id]/retry-merge`

**Description**: Retry a failed audio merge job. Only recordings with `failed` status can be retried.

**Auth**: Owning `therapist`

**Response** (`200 OK`):

```json
{
  "success": true,
  "recordingId": "uuid",
  "status": "merging",
  "jobId": "uuid",
  "chunksCount": 5,
  "message": "Retrying audio merge. This may take a moment."
}
```

**Error Responses**:

- `400`: Can only retry failed recordings
- `400`: No audio chunks available to merge

---

### `POST /api/recordings/[id]/create-session`

**Description**: Create a therapy session from a completed recording. Automatically fills in data from the associated recording link if available. For multi-patient recordings, auto-creates a group and group session.

**Auth**: Owning `therapist`

**Request**:

```json
{
  "title": "Session with John",
  "sessionDate": "2026-01-15",
  "patientIds": ["uuid1"],
  "groupId": null
}
```

| Field        | Type     | Required | Description                                              |
|--------------|----------|----------|----------------------------------------------------------|
| `title`      | string   | No       | Session title (falls back to recording link or recording title) |
| `sessionDate`| string   | No       | Session date (falls back to recording link or recorded date)   |
| `patientIds` | string[] | No       | Patient IDs (falls back to recording link patient IDs)         |
| `groupId`    | UUID     | No       | Explicit group ID (auto-creates group if multiple patients)    |

**Response** (`201 Created`):

```json
{
  "success": true,
  "sessionId": "uuid",
  "session": {
    "id": "uuid",
    "therapistId": "uuid",
    "patientId": "uuid",
    "title": "Session with John",
    "sessionDate": "2026-01-15",
    "sessionType": "individual",
    "audioUrl": "recordings/uuid/merged.webm",
    "transcriptionStatus": "pending"
  }
}
```

**Error Responses**:

- `400`: Recording must be completed before creating a session
- `400`: Recording has already been used to create a session
- `400`: Title and at least one patient are required
- `404`: Recording not found
- `403`: Forbidden
