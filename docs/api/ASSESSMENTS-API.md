# Assessments API Reference

## Overview

The Assessments API manages clinical assessment workflows including listing assessment sessions, retrieving full assessment details (instrument + items + responses), saving item responses, and completing assessments with scoring. All assessment endpoints enforce role-based access control and log PHI access for HIPAA compliance.

## Authentication

All endpoints require a valid Firebase ID token passed via the `Authorization` header:

```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### `GET /api/assessments`

**Description**: List assessment sessions with role-based scoping. Therapists see only their own sessions, org admins see all sessions within their organization, and super admins see all sessions platform-wide.

**Auth**: `therapist`, `org_admin`, `super_admin` (patients are forbidden)

**Query Parameters**:

| Parameter      | Type   | Required | Description                                                                 |
|----------------|--------|----------|-----------------------------------------------------------------------------|
| `patientId`    | UUID   | No       | Filter by patient                                                          |
| `instrumentId` | UUID   | No       | Filter by assessment instrument                                            |
| `status`       | string | No       | Filter by status: `in_progress`, `completed`, `abandoned`                   |
| `timepoint`    | string | No       | Filter by timepoint: `screening`, `baseline`, `mid_treatment`, `post_treatment`, `follow_up_1m`, `follow_up_3m`, `follow_up_6m`, `follow_up_12m`, `other` |
| `search`       | string | No       | Search term                                                                |
| `limit`        | number | No       | Results per page (1-100, default 50)                                       |
| `offset`       | number | No       | Pagination offset (default 0)                                              |

**Response** (`200 OK`):

```json
{
  "assessments": [
    {
      "id": "uuid",
      "instrumentId": "uuid",
      "patientId": "uuid",
      "therapistId": "uuid",
      "status": "in_progress",
      "timepoint": "baseline",
      "totalScore": null,
      "subscaleScores": null,
      "clinicianNotes": null,
      "completedAt": null,
      "createdAt": "2026-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /api/assessments/[sessionId]`

**Description**: Get full assessment session details including the instrument definition, items, and all saved responses.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Path Parameters**:

| Parameter   | Type | Description               |
|-------------|------|---------------------------|
| `sessionId` | UUID | Assessment session ID     |

**Response** (`200 OK`):

```json
{
  "session": {
    "id": "uuid",
    "instrumentId": "uuid",
    "patientId": "uuid",
    "therapistId": "uuid",
    "status": "in_progress",
    "timepoint": "baseline",
    "totalScore": null,
    "subscaleScores": null,
    "clinicianNotes": null,
    "completedAt": null,
    "createdAt": "2026-01-15T10:00:00.000Z"
  }
}
```

**Error Responses**:

- `404`: Assessment session not found
- `403`: User does not have access to this session

---

### `PATCH /api/assessments/[sessionId]`

**Description**: Update an assessment session. Can update clinician notes, timepoint, or abandon the session.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Path Parameters**:

| Parameter   | Type | Description               |
|-------------|------|---------------------------|
| `sessionId` | UUID | Assessment session ID     |

**Request**:

```json
{
  "clinicianNotes": "Patient showed improvement in trauma recall.",
  "timepoint": "mid_treatment",
  "status": "abandoned"
}
```

All fields are optional. `status` can only be set to `"abandoned"`.

**Response** (`200 OK`):

```json
{
  "session": {
    "id": "uuid",
    "clinicianNotes": "Patient showed improvement in trauma recall.",
    "timepoint": "mid_treatment",
    "status": "abandoned"
  }
}
```

**Error Responses**:

- `404`: Assessment session not found
- `403`: Forbidden
- `409`: Cannot update a completed or already-abandoned session

---

### `DELETE /api/assessments/[sessionId]`

**Description**: Delete an in-progress assessment session. Only sessions with `in_progress` status can be deleted.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Path Parameters**:

| Parameter   | Type | Description               |
|-------------|------|---------------------------|
| `sessionId` | UUID | Assessment session ID     |

**Response** (`200 OK`):

```json
{
  "message": "Assessment session deleted successfully"
}
```

**Error Responses**:

- `404`: Assessment session not found
- `403`: Forbidden
- `409`: Can only delete in-progress sessions

---

### `POST /api/assessments/[sessionId]/responses`

**Description**: Save or auto-save item responses in a batch upsert operation. Supports partial saves for auto-save functionality.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Path Parameters**:

| Parameter   | Type | Description               |
|-------------|------|---------------------------|
| `sessionId` | UUID | Assessment session ID     |

**Request**:

```json
{
  "responses": [
    {
      "itemId": "uuid",
      "responseNumeric": 3,
      "responseText": null,
      "responseValue": null
    },
    {
      "itemId": "uuid",
      "responseNumeric": null,
      "responseText": "Patient described recurring nightmares.",
      "responseValue": null
    }
  ]
}
```

| Field             | Type    | Required | Description                          |
|-------------------|---------|----------|--------------------------------------|
| `responses`       | array   | Yes      | Array of response objects (min 1)    |
| `itemId`          | UUID    | Yes      | Assessment item ID                   |
| `responseNumeric` | integer | No       | Numeric response (for Likert scales) |
| `responseText`    | string  | No       | Free-text response                   |
| `responseValue`   | string  | No       | String value response (max 255)      |

**Response** (`200 OK`):

```json
{
  "savedCount": 2,
  "responses": [...]
}
```

**Error Responses**:

- `400`: Invalid request body
- `404`: Assessment session not found
- `403`: Forbidden
- `409`: Session is not in progress

---

### `POST /api/assessments/[sessionId]/complete`

**Description**: Calculate scores and mark the assessment as completed. Automatically computes total score and subscale scores based on the instrument's scoring method.

**Auth**: Owning `therapist`, `org_admin`, `super_admin`

**Path Parameters**:

| Parameter   | Type | Description               |
|-------------|------|---------------------------|
| `sessionId` | UUID | Assessment session ID     |

**Request** (optional body):

```json
{
  "clinicianNotes": "Assessment completed with patient cooperation."
}
```

**Response** (`200 OK`):

```json
{
  "session": {
    "id": "uuid",
    "status": "completed",
    "totalScore": 42,
    "subscaleScores": {
      "intrusion": 12,
      "avoidance": 15,
      "arousal": 15
    },
    "completedAt": "2026-01-15T11:30:00.000Z",
    "clinicianNotes": "Assessment completed with patient cooperation."
  }
}
```

**Error Responses**:

- `404`: Assessment session not found
- `403`: Forbidden
- `409`: Session is not in progress
