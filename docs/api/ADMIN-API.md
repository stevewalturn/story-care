# Organization Admin API Reference

## Overview

The Organization Admin API provides endpoints for org admins to manage their organization, view metrics, and configure organization-scoped resources including treatment modules, templates, and AI prompts. All endpoints are scoped to the authenticated user's organization.

## Authentication

All endpoints require a valid Firebase ID token passed via the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

All endpoints require the `org_admin` role.

## Endpoints

### `GET /api/org-admin/organization`

**Description**: Get the authenticated org admin's organization details.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "id": "uuid",
  "name": "Sage Health Clinic",
  "slug": "sage-health",
  "contactEmail": "admin@sagehealth.com",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-01-15T10:00:00.000Z"
}
```

**Error Responses**:

- `404`: Organization not found for user

---

### `PATCH /api/org-admin/organization`

**Description**: Update the authenticated org admin's organization. Only `name` and `contactEmail` can be updated.

**Auth**: `org_admin`

**Request**:

```json
{
  "name": "Sage Health Clinic (Updated)",
  "contactEmail": "newemail@sagehealth.com"
}
```

| Field          | Type   | Required | Description                    |
|----------------|--------|----------|--------------------------------|
| `name`         | string | No       | Organization name (1-255 char) |
| `contactEmail` | string | No       | Valid email address            |

**Response** (`200 OK`):

```json
{
  "id": "uuid",
  "name": "Sage Health Clinic (Updated)",
  "contactEmail": "newemail@sagehealth.com",
  "updatedAt": "2026-01-15T12:00:00.000Z"
}
```

**Error Responses**:

- `400`: Validation error
- `404`: Organization not found

---

### `GET /api/org-admin/metrics`

**Description**: Get organization dashboard metrics including user counts, session statistics, and engagement data.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "metrics": {
    "totalTherapists": 12,
    "totalPatients": 85,
    "totalSessions": 340,
    "activeSessions": 15
  }
}
```

---

## Modules

### `GET /api/org-admin/modules`

**Description**: List organization-scoped treatment modules and optionally include system templates. Supports filtering by therapeutic domain and status.

**Auth**: `org_admin`

**Query Parameters**:

| Parameter          | Type   | Required | Description                                              |
|--------------------|--------|----------|----------------------------------------------------------|
| `domain`           | string | No       | Filter by therapeutic domain                             |
| `status`           | string | No       | Filter: `active`, `archived`, `pending_approval`         |
| `includeTemplates` | string | No       | Include system templates (default `true`, set `false` to exclude) |

**Response** (`200 OK`):

```json
{
  "modules": [
    {
      "id": "uuid",
      "name": "PTSD Recovery Module",
      "domain": "ptsd",
      "description": "...",
      "scope": "organization",
      "organizationId": "uuid",
      "status": "active"
    }
  ],
  "templates": [
    {
      "id": "uuid",
      "name": "Standard Depression Module",
      "domain": "depression",
      "scope": "system",
      "status": "active"
    }
  ],
  "orgCount": 5,
  "templateCount": 10
}
```

---

### `POST /api/org-admin/modules`

**Description**: Create a new organization module from scratch, or copy an existing system template to the organization. To copy a template, include `copyFromTemplateId` in the request body.

**Auth**: `org_admin`

**Request** (create from scratch):

```json
{
  "name": "Custom Anxiety Module",
  "domain": "anxiety",
  "description": "Organization-specific anxiety treatment module",
  "aiPromptText": "Analyze the following transcript for anxiety markers...",
  "aiPromptMetadata": {},
  "linkedPromptIds": ["uuid1", "uuid2"]
}
```

**Request** (copy from template):

```json
{
  "copyFromTemplateId": "uuid",
  "name": "Our PTSD Module"
}
```

**Response** (`201 Created`):

```json
{
  "module": {
    "id": "uuid",
    "name": "Custom Anxiety Module",
    "domain": "anxiety",
    "scope": "organization",
    "status": "active"
  },
  "message": "Organization module created successfully"
}
```

**Error Responses**:

- `400`: Invalid request data (Zod validation errors)

---

### `GET /api/org-admin/modules/[id]`

**Description**: Get specific module details. Can access organization modules from the same org and system templates.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "module": {
    "id": "uuid",
    "name": "PTSD Recovery Module",
    "domain": "ptsd",
    "description": "...",
    "scope": "organization",
    "organizationId": "uuid",
    "aiPromptText": "...",
    "status": "active"
  }
}
```

**Error Responses**:

- `403`: Cannot access private modules
- `404`: Module not found or access denied

---

### `PUT /api/org-admin/modules/[id]`

**Description**: Update an organization module. Can only update modules with `organization` scope belonging to the admin's organization.

**Auth**: `org_admin`

**Request**:

```json
{
  "name": "Updated Module Name",
  "description": "Updated description",
  "aiPromptText": "Updated prompt...",
  "aiPromptMetadata": {},
  "status": "active",
  "linkedPromptIds": ["uuid1"]
}
```

**Response** (`200 OK`):

```json
{
  "module": { "id": "uuid", "name": "Updated Module Name" },
  "message": "Module updated successfully"
}
```

**Error Responses**:

- `400`: Invalid request data
- `403`: Can only update organization modules
- `404`: Module not found or access denied

---

### `DELETE /api/org-admin/modules/[id]`

**Description**: Archive an organization module (soft delete). Can only archive modules with `organization` scope.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "message": "Module archived successfully"
}
```

**Error Responses**:

- `403`: Can only archive organization modules
- `404`: Module not found or access denied

---

## Templates

### `GET /api/org-admin/templates`

**Description**: Fetch organization templates (reflection and survey) plus optionally system templates.

**Auth**: `org_admin`

**Query Parameters**:

| Parameter       | Type   | Required | Description                              |
|-----------------|--------|----------|------------------------------------------|
| `includeSystem` | string | No       | Set to `true` to include system templates|

**Response** (`200 OK`):

```json
{
  "templates": [
    {
      "id": "uuid",
      "title": "Weekly Reflection",
      "type": "reflection",
      "scope": "organization",
      "category": "custom",
      "questions": [...]
    }
  ],
  "systemTemplates": [
    {
      "id": "uuid",
      "title": "Standard Patient Survey",
      "type": "survey",
      "scope": "system"
    }
  ]
}
```

---

### `POST /api/org-admin/templates`

**Description**: Create a new organization-scoped reflection or survey template.

**Auth**: `org_admin`

**Request**:

```json
{
  "type": "reflection",
  "title": "Weekly Reflection Template",
  "description": "End of week patient reflection",
  "category": "custom",
  "questions": [
    {
      "questionText": "How did this week make you feel?",
      "questionType": "open_text"
    }
  ]
}
```

| Field         | Type   | Required | Description                           |
|---------------|--------|----------|---------------------------------------|
| `type`        | string | Yes      | `reflection` or `survey`              |
| `title`       | string | Yes      | Template title                        |
| `description` | string | No       | Template description                  |
| `category`    | string | No       | Category (default: `custom`)          |
| `questions`   | array  | Yes      | Array of question objects (min 1)     |

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "title": "Weekly Reflection Template",
    "type": "reflection",
    "scope": "organization"
  }
}
```

---

### `GET /api/org-admin/templates/[id]`

**Description**: Fetch a single template by ID. Org admin can access system templates, their organization's templates, and their own private templates.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "template": {
    "id": "uuid",
    "title": "Weekly Reflection",
    "type": "reflection",
    "scope": "organization",
    "questions": [...]
  }
}
```

---

### `PUT /api/org-admin/templates/[id]`

**Description**: Update an existing organization template. Can only edit templates with `organization` scope from the admin's organization.

**Auth**: `org_admin`

**Request**:

```json
{
  "title": "Updated Template Title",
  "description": "Updated description",
  "category": "assessment",
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
    "title": "Updated Template Title",
    "type": "reflection"
  }
}
```

**Error Responses**:

- `400`: Title and at least one question required
- `403`: Can only edit templates from your organization
- `404`: Template not found

---

## Prompts

### `GET /api/org-admin/prompts`

**Description**: List all accessible AI prompts, including system prompts and the org admin's organization prompts. Only active prompts are returned.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "prompts": [
    {
      "id": "uuid",
      "name": "Transcript Analysis",
      "promptText": "Analyze the following therapy transcript...",
      "description": "Analyzes transcripts for therapeutic insights",
      "category": "analysis",
      "icon": "sparkles",
      "outputType": "text",
      "scope": "system",
      "isActive": true
    }
  ]
}
```

---

### `POST /api/org-admin/prompts`

**Description**: Create a new organization-scoped AI prompt.

**Auth**: `org_admin`

**Request**:

```json
{
  "name": "Custom Analysis Prompt",
  "promptText": "Analyze the following for our specific methodology...",
  "description": "Organization-specific transcript analysis",
  "category": "analysis",
  "icon": "brain",
  "outputType": "text",
  "jsonSchema": null,
  "blocks": null,
  "useAdvancedMode": false
}
```

| Field            | Type    | Required | Description                                              |
|------------------|---------|----------|----------------------------------------------------------|
| `name`           | string  | Yes      | Prompt name                                              |
| `promptText`     | string  | Yes      | The prompt text content                                  |
| `category`       | string  | Yes      | `analysis`, `creative`, `extraction`, or `reflection`    |
| `description`    | string  | No       | Prompt description                                       |
| `icon`           | string  | No       | Icon name (default: `sparkles`)                          |
| `outputType`     | string  | No       | `text` (default) or `json`                               |
| `jsonSchema`     | object  | No       | JSON schema for structured output                        |
| `blocks`         | object  | No       | Block definitions for advanced mode                      |
| `useAdvancedMode`| boolean | No       | Enable advanced mode (default: `false`)                  |

**Response** (`201 Created`):

```json
{
  "prompt": {
    "id": "uuid",
    "name": "Custom Analysis Prompt",
    "scope": "organization"
  }
}
```

---

### `GET /api/org-admin/prompts/[id]`

**Description**: Get details for a specific AI prompt.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "prompt": {
    "id": "uuid",
    "name": "Custom Analysis Prompt",
    "promptText": "...",
    "category": "analysis",
    "scope": "organization"
  }
}
```

---

### `PATCH /api/org-admin/prompts/[id]`

**Description**: Update an organization prompt. Can only edit prompts from the admin's own organization with `organization` scope.

**Auth**: `org_admin`

**Request**:

```json
{
  "name": "Updated Prompt Name",
  "promptText": "Updated prompt text...",
  "category": "creative",
  "isActive": true
}
```

All fields are optional.

**Response** (`200 OK`):

```json
{
  "prompt": { "id": "uuid", "name": "Updated Prompt Name" }
}
```

**Error Responses**:

- `403`: Can only edit prompts from your organization
- `404`: Prompt not found

---

### `DELETE /api/org-admin/prompts/[id]`

**Description**: Soft-delete an organization prompt (sets `isActive` to `false`). Can only delete prompts from the admin's own organization.

**Auth**: `org_admin`

**Response** (`200 OK`):

```json
{
  "success": true
}
```

**Error Responses**:

- `403`: Can only delete prompts from your organization
- `404`: Prompt not found
