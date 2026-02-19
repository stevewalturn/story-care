# Super Admin API Reference

## Overview

The Super Admin API provides platform-wide management endpoints for super administrators. This includes managing organizations, users, module templates, reflection/survey templates, AI prompts, AI models, assessment instruments, pending invitations, audit logs, and platform settings.

## Authentication

All endpoints require a valid Firebase ID token passed via the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

All endpoints require the `super_admin` role.

## Platform

### `GET /api/super-admin/metrics`

**Description**: Get platform-wide statistics including total organizations, users, sessions, and engagement metrics.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "metrics": {
    "totalOrganizations": 25,
    "totalUsers": 500,
    "totalSessions": 2000,
    "totalPatients": 300,
    "totalTherapists": 150
  }
}
```

---

### `GET /api/super-admin/settings`

**Description**: Get platform settings. Returns defaults if no settings record exists.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "settings": {
    "platformName": "StoryCare",
    "supportEmail": "support@storycare.com",
    "defaultTrialDuration": 30,
    "defaultAiCredits": 1000,
    "imageGenModel": "dall-e-3",
    "defaultStorageQuota": 10737418240,
    "maxFileUploadSize": 524288000,
    "requireEmailVerification": true,
    "enableMfaForAdmins": true,
    "sessionTimeout": 15
  }
}
```

---

### `PUT /api/super-admin/settings`

**Description**: Update platform settings. Creates a new settings record if none exists.

**Auth**: `super_admin`

**Request**:

```json
{
  "supportEmail": "help@storycare.com",
  "defaultAiCredits": 2000,
  "imageGenModel": "imagen-3",
  "defaultStorageQuota": 21474836480,
  "maxFileUploadSize": 1073741824,
  "requireEmailVerification": true,
  "enableMfaForAdmins": true,
  "sessionTimeout": 30
}
```

**Response** (`200 OK`):

```json
{
  "settings": {
    "id": "uuid",
    "supportEmail": "help@storycare.com",
    "defaultAiCredits": 2000,
    "updatedBy": "uuid",
    "updatedAt": "2026-01-15T12:00:00.000Z"
  }
}
```

---

## Users

### `GET /api/super-admin/users`

**Description**: List all users across all organizations with pagination and filtering.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `search`  | string | No       | Search by name or email              |
| `role`    | string | No       | Filter by role                       |
| `page`    | number | No       | Page number (default: 1)            |
| `limit`   | number | No       | Items per page (default: 10)        |

**Response** (`200 OK`):

```json
{
  "users": [
    {
      "id": "uuid",
      "email": "therapist@example.com",
      "name": "Dr. Smith",
      "role": "therapist",
      "status": "active",
      "firebaseUid": "firebase-uid",
      "organizationId": "uuid",
      "organizationName": "Sage Health Clinic",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "lastLoginAt": "2026-01-15T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 250,
    "totalPages": 25
  }
}
```

---

## Audit Logs

### `GET /api/super-admin/audit`

**Description**: List audit logs across the platform with filtering and statistics. Includes user information for each log entry.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter   | Type   | Required | Description                                |
|-------------|--------|----------|--------------------------------------------|
| `search`    | string | No       | Search by resource type                    |
| `action`    | string | No       | Filter by action type                      |
| `startDate` | string | No       | ISO date string for start range            |
| `endDate`   | string | No       | ISO date string for end range              |
| `page`      | number | No       | Page number (default: 1)                  |
| `limit`     | number | No       | Items per page (default: 10)              |

**Response** (`200 OK`):

```json
{
  "logs": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "Dr. Smith",
      "userEmail": "smith@example.com",
      "action": "read",
      "resourceType": "assessment_session",
      "resourceId": "uuid",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": { "fields": ["status"] },
      "timestamp": "2026-01-15T10:00:00.000Z"
    }
  ],
  "stats": {
    "totalEvents": 5000,
    "failedLogins": 12,
    "criticalEvents": 45
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5000,
    "totalPages": 500
  }
}
```

---

## Pending Invitations

### `GET /api/super-admin/pending-invitations`

**Description**: List pending user invitations awaiting super admin approval. Enriched with inviter name and organization name.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter | Type   | Required | Description                              |
|-----------|--------|----------|------------------------------------------|
| `search`  | string | No       | Filter by name or email                  |
| `role`    | string | No       | Filter: `patient` or `therapist`         |
| `page`    | number | No       | Page number (default: 1)               |
| `limit`   | number | No       | Items per page (default: 20, max: 100) |

**Response** (`200 OK`):

```json
{
  "invitations": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "patient",
      "status": "pending_approval",
      "organizationId": "uuid",
      "invitedBy": "uuid",
      "createdAt": "2026-01-14T10:00:00.000Z",
      "inviterName": "Dr. Smith",
      "organizationName": "Sage Health Clinic"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### `GET /api/super-admin/pending-invitations/count`

**Description**: Lightweight endpoint returning only the count of pending invitations. Designed for sidebar badge display.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "count": 5
}
```

---

### `PATCH /api/super-admin/pending-invitations/[id]`

**Description**: Approve or reject a pending user invitation. Approving generates an invitation token, sends the appropriate invitation email (patient or therapist), and updates the user status to `invited`. Rejecting updates the status to `rejected`.

**Auth**: `super_admin`

**Request** (approve):

```json
{
  "decision": "approve"
}
```

**Request** (reject):

```json
{
  "decision": "reject",
  "rejectionReason": "Incomplete application information"
}
```

| Field             | Type   | Required | Description                            |
|-------------------|--------|----------|----------------------------------------|
| `decision`        | string | Yes      | `approve` or `reject`                  |
| `rejectionReason` | string | No       | Reason for rejection (only for reject) |

**Response** (`200 OK`) - Approve:

```json
{
  "success": true,
  "message": "Invitation approved. An invitation email has been sent to john@example.com."
}
```

**Response** (`200 OK`) - Reject:

```json
{
  "success": true,
  "message": "Invitation rejected."
}
```

**Error Responses**:

- `400`: User status is not `pending_approval`
- `404`: User not found

---

## Module Templates

### `GET /api/super-admin/module-templates`

**Description**: List all system-scoped treatment module templates with optional filtering.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `domain`  | string | No       | Filter by therapeutic domain                     |
| `status`  | string | No       | Filter: `active`, `archived`, `pending_approval` |

**Response** (`200 OK`):

```json
{
  "templates": [
    {
      "id": "uuid",
      "name": "Standard PTSD Module",
      "domain": "ptsd",
      "scope": "system",
      "status": "active"
    }
  ],
  "count": 10
}
```

---

### `POST /api/super-admin/module-templates`

**Description**: Create a new system-scoped treatment module template.

**Auth**: `super_admin`

**Request**:

```json
{
  "name": "New Depression Module",
  "domain": "depression",
  "description": "Standard depression treatment module",
  "aiPromptText": "Analyze the following transcript...",
  "aiPromptMetadata": {},
  "linkedPromptIds": ["uuid1"]
}
```

**Response** (`201 Created`):

```json
{
  "template": {
    "id": "uuid",
    "name": "New Depression Module",
    "scope": "system",
    "status": "active"
  },
  "message": "System template created successfully"
}
```

---

### `GET /api/super-admin/module-templates/[id]`

**Description**: Get specific system template details.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "name": "Standard PTSD Module",
    "domain": "ptsd",
    "scope": "system",
    "status": "active",
    "aiPromptText": "...",
    "description": "..."
  }
}
```

**Error Responses**:

- `404`: Template not found or not a system template

---

### `PUT /api/super-admin/module-templates/[id]`

**Description**: Update a system template. Can only update templates with `system` scope.

**Auth**: `super_admin`

**Request**:

```json
{
  "name": "Updated Module Name",
  "description": "Updated description",
  "aiPromptText": "Updated prompt...",
  "status": "active",
  "linkedPromptIds": ["uuid1", "uuid2"]
}
```

**Response** (`200 OK`):

```json
{
  "template": { "id": "uuid", "name": "Updated Module Name" },
  "message": "Template updated successfully"
}
```

---

### `DELETE /api/super-admin/module-templates/[id]`

**Description**: Archive a system template (soft delete).

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "message": "Template archived successfully"
}
```

---

## Templates (Reflection and Survey)

### `GET /api/super-admin/templates`

**Description**: Fetch all system-scoped reflection and survey templates.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Standard Patient Reflection",
      "type": "reflection",
      "scope": "system",
      "category": "engagement",
      "questions": [...]
    },
    {
      "id": "uuid",
      "title": "Outcome Survey",
      "type": "survey",
      "scope": "system",
      "category": "outcomes",
      "questions": [...]
    }
  ]
}
```

---

### `POST /api/super-admin/templates`

**Description**: Create a new system-scoped reflection or survey template.

**Auth**: `super_admin`

**Request**:

```json
{
  "type": "survey",
  "title": "Treatment Outcome Survey",
  "description": "Standard post-treatment outcome survey",
  "category": "outcomes",
  "questions": [
    {
      "questionText": "Rate your overall progress",
      "questionType": "likert",
      "scaleMin": 1,
      "scaleMax": 5
    }
  ]
}
```

| Field         | Type   | Required | Description                      |
|---------------|--------|----------|----------------------------------|
| `type`        | string | Yes      | `reflection` or `survey`         |
| `title`       | string | Yes      | Template title                   |
| `description` | string | No       | Template description             |
| `category`    | string | No       | Category (default: `custom`)     |
| `questions`   | array  | Yes      | Array of questions (min 1)       |

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "title": "Treatment Outcome Survey",
    "type": "survey",
    "scope": "system"
  }
}
```

---

### `GET /api/super-admin/templates/[id]`

**Description**: Fetch a single template by ID. Super admin can access all templates.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "title": "Standard Patient Reflection",
    "type": "reflection",
    "scope": "system",
    "questions": [...]
  }
}
```

---

### `PUT /api/super-admin/templates/[id]`

**Description**: Update an existing system template. Can only edit templates with `system` scope.

**Auth**: `super_admin`

**Request**:

```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "category": "outcomes",
  "questions": [
    { "questionText": "Updated question?", "questionType": "open_text" }
  ]
}
```

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "title": "Updated Survey Title",
    "type": "survey"
  }
}
```

**Error Responses**:

- `400`: Title and at least one question required
- `403`: Can only edit system templates
- `404`: Template not found

---

## Prompts

### `GET /api/super-admin/prompts`

**Description**: List AI prompts filtered by scope. Defaults to `system` scope.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter | Type   | Required | Description                                          |
|-----------|--------|----------|------------------------------------------------------|
| `scope`   | string | No       | Filter: `system` (default), `organization`, `private`|

**Response** (`200 OK`):

```json
{
  "prompts": [
    {
      "id": "uuid",
      "name": "Transcript Analysis",
      "promptText": "...",
      "category": "analysis",
      "scope": "system",
      "isActive": true,
      "useCount": 42
    }
  ]
}
```

---

### `POST /api/super-admin/prompts`

**Description**: Create a new system-scoped AI prompt.

**Auth**: `super_admin`

**Request**:

```json
{
  "name": "New System Prompt",
  "promptText": "Analyze the following transcript...",
  "description": "System-level transcript analysis",
  "category": "analysis",
  "icon": "sparkles",
  "outputType": "text",
  "jsonSchema": null,
  "blocks": null,
  "useAdvancedMode": false
}
```

| Field            | Type    | Required | Description                                           |
|------------------|---------|----------|-------------------------------------------------------|
| `name`           | string  | Yes      | Prompt name                                           |
| `promptText`     | string  | Yes      | The prompt text                                       |
| `category`       | string  | Yes      | `analysis`, `creative`, `extraction`, or `reflection` |
| `description`    | string  | No       | Prompt description                                    |
| `icon`           | string  | No       | Icon name (default: `sparkles`)                       |
| `outputType`     | string  | No       | `text` (default) or `json`                            |
| `jsonSchema`     | object  | No       | JSON schema for structured output                     |
| `blocks`         | object  | No       | Block definitions                                     |
| `useAdvancedMode`| boolean | No       | Enable advanced mode (default: `false`)               |

**Response** (`201 Created`):

```json
{
  "prompt": {
    "id": "uuid",
    "name": "New System Prompt",
    "scope": "system"
  }
}
```

---

### `GET /api/super-admin/prompts/[id]`

**Description**: Get details for a specific AI prompt.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "prompt": {
    "id": "uuid",
    "name": "Transcript Analysis",
    "promptText": "...",
    "category": "analysis",
    "scope": "system"
  }
}
```

---

### `PATCH /api/super-admin/prompts/[id]`

**Description**: Update any AI prompt. Super admin can edit prompts of any scope.

**Auth**: `super_admin`

**Request**:

```json
{
  "name": "Updated Prompt",
  "systemPrompt": "Updated system prompt text...",
  "description": "Updated description",
  "category": "creative",
  "icon": "brain",
  "isActive": true,
  "outputType": "json",
  "jsonSchema": { "type": "object" },
  "blocks": null
}
```

All fields are optional.

**Response** (`200 OK`):

```json
{
  "prompt": { "id": "uuid", "name": "Updated Prompt" }
}
```

---

### `DELETE /api/super-admin/prompts/[id]`

**Description**: Soft-delete any AI prompt (sets `isActive` to `false`).

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "success": true
}
```

---

## AI Models

### `GET /api/super-admin/ai-models`

**Description**: List all AI models with optional filtering. Also returns category counts and unique providers for the management UI.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter  | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `category` | string | No       | Filter by model category             |
| `status`   | string | No       | Filter by model status               |
| `provider` | string | No       | Filter by provider                   |
| `search`   | string | No       | Search by model name or ID           |
| `limit`    | number | No       | Results per page                     |
| `offset`   | number | No       | Pagination offset                    |

**Response** (`200 OK`):

```json
{
  "models": [
    {
      "id": "gpt-4",
      "displayName": "GPT-4",
      "provider": "openai",
      "category": "text_generation",
      "status": "active",
      "inputCostPer1k": 0.03,
      "outputCostPer1k": 0.06
    }
  ],
  "counts": {
    "text_generation": 5,
    "image_generation": 3,
    "transcription": 2
  },
  "providers": ["openai", "google", "anthropic"],
  "total": 10
}
```

---

### `POST /api/super-admin/ai-models`

**Description**: Create a new AI model entry.

**Auth**: `super_admin`

**Request**:

```json
{
  "modelId": "gpt-4o",
  "displayName": "GPT-4o",
  "provider": "openai",
  "category": "text_generation",
  "status": "active",
  "inputCostPer1k": 0.005,
  "outputCostPer1k": 0.015
}
```

**Response** (`201 Created`):

```json
{
  "model": {
    "id": "gpt-4o",
    "displayName": "GPT-4o",
    "provider": "openai"
  }
}
```

**Error Responses**:

- `400`: Invalid request body
- `409`: A model with this ID already exists

---

### `GET /api/super-admin/ai-models/[id]`

**Description**: Get details for a specific AI model.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "model": {
    "id": "gpt-4",
    "displayName": "GPT-4",
    "provider": "openai",
    "category": "text_generation",
    "status": "active"
  }
}
```

---

### `PATCH /api/super-admin/ai-models/[id]`

**Description**: Update an AI model.

**Auth**: `super_admin`

**Request**:

```json
{
  "displayName": "GPT-4 (Updated)",
  "status": "inactive",
  "inputCostPer1k": 0.025
}
```

**Response** (`200 OK`):

```json
{
  "model": { "id": "gpt-4", "displayName": "GPT-4 (Updated)" }
}
```

---

### `DELETE /api/super-admin/ai-models/[id]`

**Description**: Delete an AI model.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "success": true
}
```

---

### `PUT /api/super-admin/ai-models/bulk`

**Description**: Bulk update the status of multiple AI models at once.

**Auth**: `super_admin`

**Request**:

```json
{
  "modelIds": ["gpt-4", "gpt-3.5-turbo"],
  "status": "inactive"
}
```

**Response** (`200 OK`):

```json
{
  "success": true,
  "updatedCount": 2,
  "models": [...]
}
```

---

## Assessment Instruments

### `GET /api/super-admin/assessment-instruments`

**Description**: List all clinical assessment instruments with optional filtering.

**Auth**: `super_admin`

**Query Parameters**:

| Parameter        | Type   | Required | Description                                                                   |
|------------------|--------|----------|-------------------------------------------------------------------------------|
| `instrumentType` | string | No       | Filter: `ptsd`, `depression`, `schizophrenia`, `substance_use`, `anxiety`, `enrollment`, `general` |
| `status`         | string | No       | Filter: `active`, `inactive`                                                  |
| `search`         | string | No       | Search by name                                                                |
| `limit`          | number | No       | Results per page (1-100, default 50)                                          |
| `offset`         | number | No       | Pagination offset (default 0)                                                 |

**Response** (`200 OK`):

```json
{
  "instruments": [
    {
      "id": "uuid",
      "name": "PCL-5",
      "fullName": "PTSD Checklist for DSM-5",
      "instrumentType": "ptsd",
      "description": "...",
      "scaleMin": 0,
      "scaleMax": 4,
      "scoringMethod": "sum",
      "status": "active",
      "itemCount": 20
    }
  ],
  "total": 5
}
```

---

### `POST /api/super-admin/assessment-instruments`

**Description**: Create a new assessment instrument with its items.

**Auth**: `super_admin`

**Request**:

```json
{
  "name": "PHQ-9",
  "fullName": "Patient Health Questionnaire-9",
  "instrumentType": "depression",
  "description": "Screening tool for depression",
  "instructions": "Over the last 2 weeks, how often have you been bothered by...",
  "scaleMin": 0,
  "scaleMax": 3,
  "scaleLabels": { "0": "Not at all", "1": "Several days", "2": "More than half the days", "3": "Nearly every day" },
  "scoringMethod": "sum",
  "totalScoreRange": { "min": 0, "max": 27 },
  "clinicalCutoffs": [
    { "min": 0, "max": 4, "label": "None-minimal", "severity": "none" },
    { "min": 5, "max": 9, "label": "Mild", "severity": "mild" },
    { "min": 10, "max": 14, "label": "Moderate", "severity": "moderate" },
    { "min": 15, "max": 19, "label": "Moderately severe", "severity": "moderately_severe" },
    { "min": 20, "max": 27, "label": "Severe", "severity": "severe" }
  ],
  "items": [
    {
      "itemNumber": 1,
      "questionText": "Little interest or pleasure in doing things",
      "itemType": "likert",
      "scaleMin": 0,
      "scaleMax": 3,
      "isReverseScored": false,
      "isRequired": true
    }
  ]
}
```

**Response** (`201 Created`):

```json
{
  "instrument": {
    "id": "uuid",
    "name": "PHQ-9",
    "fullName": "Patient Health Questionnaire-9",
    "instrumentType": "depression",
    "status": "active"
  }
}
```

---

### `GET /api/super-admin/assessment-instruments/[id]`

**Description**: Get instrument details including all items.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "instrument": {
    "id": "uuid",
    "name": "PCL-5",
    "fullName": "PTSD Checklist for DSM-5",
    "items": [
      {
        "id": "uuid",
        "itemNumber": 1,
        "questionText": "...",
        "itemType": "likert"
      }
    ]
  }
}
```

---

### `PATCH /api/super-admin/assessment-instruments/[id]`

**Description**: Update an instrument. Supports both status-only updates and full instrument updates (including items).

**Auth**: `super_admin`

**Request** (status-only):

```json
{
  "status": "inactive"
}
```

**Request** (full update):

```json
{
  "name": "PCL-5 (Revised)",
  "description": "Updated description",
  "items": [...]
}
```

**Response** (`200 OK`):

```json
{
  "instrument": {
    "id": "uuid",
    "name": "PCL-5 (Revised)",
    "status": "inactive"
  }
}
```

---

### `DELETE /api/super-admin/assessment-instruments/[id]`

**Description**: Delete an instrument. Cannot delete instruments that have associated assessment sessions.

**Auth**: `super_admin`

**Response** (`200 OK`):

```json
{
  "message": "Instrument deleted successfully"
}
```

**Error Responses**:

- `404`: Instrument not found
- `409`: Cannot delete instrument with existing sessions
