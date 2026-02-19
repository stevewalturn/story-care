# Patients API Reference

## Overview

The Patients API manages patient records, including CRUD operations, archive functionality, invitation management, reference images, assessments, and response retrieval. Patients are always scoped to a therapist (or organization for admins). All endpoints enforce HIPAA compliance with audit logging and presigned URLs.

## Authentication

All endpoints require a valid Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

## Endpoints

---

### `GET /api/patients`

**Description**: List patients for the authenticated user. Therapists see their assigned patients; org admins see all patients in their organization; super admins see all patients. Supports archive filtering and search.

**Auth**: Therapist, Org Admin, or Super Admin

**Query Parameters**:

| Param      | Type   | Required | Description                                    |
|------------|--------|----------|------------------------------------------------|
| `archived` | string | No       | `"true"` to show only archived patients        |
| `search`   | string | No       | Search by patient name or email                |

**Response** (200):
```json
{
  "patients": [
    {
      "id": "uuid",
      "name": "Patient Name",
      "email": "patient@example.com",
      "avatarUrl": "https://signed-gcs-url...",
      "referenceImageUrl": "https://signed-gcs-url...",
      "status": "active",
      "therapistId": "uuid",
      "organizationId": "uuid",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "archivedAt": null
    }
  ]
}
```

---

### `POST /api/patients`

**Description**: Create a new patient and send an invitation email. The patient record is created with status `"invited"` and an invitation token is generated. The invitation email is sent via Paubox (HIPAA-compliant).

**Auth**: Therapist, Org Admin, or Super Admin

**Request**:
```json
{
  "name": "Patient Name",
  "email": "patient@example.com",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-15"
}
```

**Response** (201):
```json
{
  "patient": {
    "id": "uuid",
    "name": "Patient Name",
    "email": "patient@example.com",
    "status": "invited",
    "therapistId": "uuid",
    "organizationId": "uuid",
    "invitationToken": "token-string",
    "createdAt": "2025-01-15T10:00:00.000Z"
  }
}
```

---

### `GET /api/patients/[id]`

**Description**: Get a single patient's details including session count, page count, and latest activity.

**Auth**: Therapist (assigned), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "patient": {
    "id": "uuid",
    "name": "Patient Name",
    "email": "patient@example.com",
    "avatarUrl": "https://signed-gcs-url...",
    "referenceImageUrl": "https://signed-gcs-url...",
    "status": "active",
    "therapistId": "uuid",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "sessionCount": 12,
    "pageCount": 5,
    "latestSessionDate": "2025-01-15"
  }
}
```

---

### `PUT /api/patients/[id]`

**Description**: Update a patient's details.

**Auth**: Therapist (assigned), Org Admin, or Super Admin (RBAC enforced)

**Request**:
```json
{
  "name": "Updated Name",
  "email": "new@example.com",
  "phone": "+1234567890"
}
```

All fields are optional.

**Response** (200):
```json
{
  "patient": { "...updated patient object..." }
}
```

---

### `DELETE /api/patients/[id]`

**Description**: Delete a patient with cascading data removal (sessions, media, pages, etc.). This is a hard delete for GDPR/data removal compliance.

**Auth**: Therapist (assigned), Org Admin, or Super Admin (RBAC enforced)

**Response** (200):
```json
{
  "success": true
}
```

---

### `POST /api/patients/[id]/archive`

**Description**: Archive a patient for the current therapist. Archive is per-therapist, not global.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "success": true,
  "message": "Patient archived"
}
```

---

### `DELETE /api/patients/[id]/archive`

**Description**: Unarchive (restore) a previously archived patient.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "success": true,
  "message": "Patient restored from archive"
}
```

---

### `POST /api/patients/[id]/resend-invitation`

**Description**: Resend the invitation email to a patient who has not yet activated their account.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "success": true,
  "message": "Invitation resent"
}
```

**Error** (400):
```json
{
  "error": "Patient has already activated their account"
}
```

---

### `GET /api/patients/[id]/responses`

**Description**: Get all reflection and survey responses submitted by a patient across all their story pages.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "reflectionResponses": [
    {
      "id": "uuid",
      "questionId": "uuid",
      "pageId": "uuid",
      "responseText": "Patient's reflection...",
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "surveyResponses": [
    {
      "id": "uuid",
      "questionId": "uuid",
      "pageId": "uuid",
      "responseValue": "4",
      "responseNumeric": 4,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### Reference Images

### `GET /api/patients/[id]/reference-images`

**Description**: Get all reference images for a patient. Reference images are used as input for AI image generation.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "images": [
    {
      "id": "uuid",
      "url": "https://signed-gcs-url...",
      "label": "Image label",
      "isPrimary": true,
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/patients/[id]/reference-images`

**Description**: Upload a new reference image for a patient.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Request**: FormData with image file

**Response** (201):
```json
{
  "image": {
    "id": "uuid",
    "url": "https://signed-gcs-url...",
    "label": "Image label",
    "isPrimary": false
  }
}
```

---

### `PATCH /api/patients/[id]/reference-images/[imageId]`

**Description**: Update a reference image's metadata (label, primary status).

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Request**:
```json
{
  "label": "Updated label",
  "isPrimary": true
}
```

**Response** (200):
```json
{
  "image": { "...updated image object..." }
}
```

---

### `DELETE /api/patients/[id]/reference-images/[imageId]`

**Description**: Delete a patient's reference image.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "success": true
}
```

---

### Assessments

### `GET /api/patients/[id]/assessments`

**Description**: Get assessment sessions for a patient.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Response** (200):
```json
{
  "assessments": [
    {
      "id": "uuid",
      "sessionId": "uuid",
      "moduleId": "uuid",
      "moduleName": "PHQ-9 Screener",
      "score": 12,
      "completedAt": "2025-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### `POST /api/patients/[id]/assessments`

**Description**: Create a new assessment session for a patient.

**Auth**: Therapist (assigned), Org Admin, or Super Admin

**Request**:
```json
{
  "moduleId": "uuid",
  "sessionId": "uuid",
  "score": 12,
  "notes": "Assessment notes"
}
```

**Response** (201):
```json
{
  "assessment": { "...assessment object..." }
}
```

---

### `POST /api/patients/upload-image`

**Description**: Upload a patient reference image to GCS.

**Auth**: Therapist or Admin

**Request**: FormData with image file

**Response** (200):
```json
{
  "url": "https://signed-gcs-url...",
  "gcsPath": "patients/images/filename.jpg"
}
```

## Error Codes

| Status | Description                                  |
|--------|----------------------------------------------|
| 400    | Invalid request body or parameters           |
| 401    | Missing or invalid authentication token      |
| 403    | Insufficient permissions (RBAC)              |
| 404    | Patient or resource not found                |
| 500    | Internal server error                        |
