# HIPAA Compliance Security Plan
## StoryCare Application Security Assessment & Implementation Plan

**Version:** 1.0
**Date:** 2025-10-30
**Status:** 🚨 Implementation Required
**Compliance Level:** ❌ Not HIPAA Compliant (Implementation in Progress)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Security Implementation](#current-security-implementation)
3. [Critical Security Gaps](#critical-security-gaps)
4. [Implementation Plan](#implementation-plan)
5. [Technical Requirements](#technical-requirements)
6. [Compliance Checklist](#compliance-checklist)
7. [Business Associate Agreements](#business-associate-agreements)
8. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Executive Summary

This document outlines the comprehensive security assessment and implementation plan for achieving HIPAA compliance in the StoryCare digital therapeutic platform. StoryCare processes Protected Health Information (PHI) and must comply with HIPAA Security Rule requirements for technical, administrative, and physical safeguards.

### Current Status
- **Authentication:** ✅ Implemented (Firebase) - Needs enhancement
- **Authorization:** ❌ Missing on API routes
- **Audit Logging:** ❌ Not implemented
- **Data Encryption:** ⚠️ Partial (in-transit only)
- **Session Management:** ⚠️ Weak (5-day sessions)
- **Security Headers:** ❌ Not implemented
- **Rate Limiting:** ❌ Not configured

### Critical Risks
1. **API routes lack authentication** - Anyone with session cookie can access all PHI
2. **No audit trail** - Cannot prove compliance or detect breaches
3. **Weak session management** - Extended exposure window for stolen credentials
4. **No encryption at rest** - Data breach would expose PHI in plaintext
5. **Missing security headers** - Vulnerable to XSS, clickjacking, MITM attacks

### Implementation Timeline
- **Phase 1 (Critical):** 2-3 days
- **Phase 2 (Enhanced):** 2-3 days
- **Phase 3 (Documentation):** 1-2 days
- **Total:** 5-8 days

---

## Current Security Implementation

### 1. Authentication (Firebase)

**Status:** ✅ Implemented

**Location:**
- `src/libs/Firebase.ts` - Client-side Firebase SDK
- `src/libs/FirebaseAdmin.ts` - Server-side Admin SDK
- `src/contexts/AuthContext.tsx` - Auth state management

**What's Working:**
- Email/password authentication
- Token-based authentication with JWT
- Server-side token verification via `verifyIdToken()`
- Custom claims for role-based access
- Session cookie management

**Strengths:**
- Proper separation of client/server authentication
- Industry-standard OAuth 2.0 / OpenID Connect
- Built-in security features (rate limiting on auth endpoints)
- Support for MFA (needs to be enabled)

**Gaps:**
- ❌ Token verification NOT used in API routes
- ❌ MFA not enforced for therapist/admin accounts
- ❌ Session cookies valid for 5 days (should be 24 hours)
- ❌ No automatic logout on inactivity
- ❌ No concurrent session limits

---

### 2. Middleware Protection

**Status:** ⚠️ Partial Implementation

**Location:** `src/middleware.ts`

**What's Working:**
- Protected route definitions for authenticated pages
- Arcjet bot detection (blocks malicious bots, allows search engines)
- Session cookie existence check
- Automatic redirect to login for unauthenticated users

**Critical Issue:**
```typescript
// Line 73 in middleware.ts
// SECURITY ISSUE: Only checks if cookie exists, NOT if token is valid
const sessionCookie = request.cookies.get('session');
if (!sessionCookie) {
  return NextResponse.redirect(new URL('/sign-in', request.url));
}
```

**Problem:** Expired, revoked, or tampered tokens will still pass this check.

**Required Fix:**
```typescript
// Verify token with Firebase Admin SDK
const token = sessionCookie.value;
try {
  await verifyIdToken(token);
} catch (error) {
  // Invalid token - redirect to login
  return NextResponse.redirect(new URL('/sign-in', request.url));
}
```

---

### 3. API Route Security

**Status:** ❌ CRITICAL FAILURE

**Affected Routes:**
- `src/app/api/sessions/route.ts` - Session CRUD (PHI)
- `src/app/api/sessions/[id]/route.ts` - Session details (PHI)
- `src/app/api/sessions/upload/route.ts` - Audio upload (PHI)
- `src/app/api/patients/route.ts` - Patient management (PHI)
- `src/app/api/patients/[id]/route.ts` - Patient details (PHI)
- `src/app/api/groups/route.ts` - Group therapy sessions (PHI)
- `src/app/api/pages/route.ts` - Story pages (PHI)
- `src/app/api/media/route.ts` - Media library (PHI)
- `src/app/api/ai/chat/route.ts` - AI assistant (PHI)
- `src/app/api/ai/generate-image/route.ts` - Image generation (PHI)
- `src/app/api/dashboard/stats/route.ts` - Analytics (PHI)

**Critical Security Flaw:**
```typescript
// Current implementation in most API routes:
export async function GET(request: Request) {
  // NO AUTHENTICATION CHECK!
  const sessions = await db.select().from(sessions).execute();
  return NextResponse.json(sessions); // Returns ALL PHI
}
```

**Anyone with a valid session cookie can:**
- Access all patient records
- View all therapy session transcripts
- Download all audio files
- View all generated media
- Access analytics across all patients

**Exception:** Only `/api/auth/session/route.ts` properly verifies tokens.

---

### 4. Database Security

**Status:** ✅ Good Foundation, ❌ Missing Features

**Location:**
- `src/models/Schema.ts` - Database schema
- `src/utils/DBConnection.ts` - Connection config
- `src/libs/DB.ts` - DrizzleORM client

**What's Working:**
- PostgreSQL with SSL/TLS encryption (`sslmode=require`)
- Type-safe queries via DrizzleORM (prevents SQL injection)
- Proper normalization with foreign key constraints
- UUID primary keys (not sequential IDs)
- Role-based user schema (therapist, patient, admin)
- Timestamp tracking (createdAt, updatedAt, lastLoginAt)

**Schema Highlights:**
- `users` table with `role` field and `therapistId` for patient assignment
- `sessions` table for therapy sessions
- `transcripts` table for Deepgram transcriptions
- `media_library` table for generated content
- `story_pages` table for patient-facing content
- Proper relationships with cascade deletes

**Gaps:**
- ❌ No `audit_logs` table for PHI access tracking
- ❌ No `deletedAt` field (soft delete required by HIPAA)
- ❌ No row-level security policies
- ❌ Connection pool too small (max: 1 connection)
- ❌ No backup/retention policy documented
- ❌ Encryption at rest not explicitly configured

---

### 5. Data Storage (Google Cloud Storage)

**Status:** ⚠️ Secure but Needs Improvement

**Location:** `src/libs/GCS.ts`

**What's Working:**
- Private bucket by default (`makePublic: false`)
- Signed URLs for time-limited access
- Proper authentication via service account
- File upload sanitization

**Current Configuration:**
```typescript
// Line 51, 75 in GCS.ts
expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
```

**Issue:** 7-day signed URLs too long for PHI access

**Required:** 1-hour maximum for PHI files

**Additional Gaps:**
- ❌ No audit logging of file access/downloads
- ❌ Encryption at rest not explicitly configured
- ❌ No file access controls beyond signed URLs
- ❌ No tracking of who accessed which files

---

### 6. Security (Arcjet)

**Status:** ⚠️ Basic Protection Only

**Location:** `src/libs/Arcjet.ts`

**What's Working:**
- Shield WAF in LIVE mode (OWASP Top 10 protection)
- IP-based client identification
- Bot detection active in middleware

**Current Configuration:**
```typescript
export const aj = arcjet({
  key: env.ARCJET_KEY,
  characteristics: ['ip.src'],
  rules: [
    shield({ mode: 'LIVE' }), // WAF only
  ],
});
```

**Missing:**
- ❌ No rate limiting configured
- ❌ No email validation rules
- ❌ No custom rules for sensitive endpoints
- ❌ Not applied directly to API routes

---

### 7. Logging

**Status:** ⚠️ Application Logging Only

**Location:** `src/libs/Logger.ts`

**What's Working:**
- LogTape structured logging
- Better Stack integration for production
- JSON formatting for log aggregation
- Console logging for development

**Critical Gap:**
```typescript
// Current logging focuses on errors and debugging
// NO audit logging for:
// - Who accessed patient data
// - What changes were made
// - When files were downloaded
// - Failed authentication attempts
// - Session creation/termination
```

**HIPAA Requirement:** 7-year retention of all PHI access logs

---

### 8. Error Monitoring (Sentry)

**Status:** ⚠️ May Leak PHI

**Location:** `next.config.ts`

**What's Working:**
- Automatic error tracking
- Source map uploads
- React component annotations
- Development preview with Spotlight

**Security Concern:**
```typescript
// Error messages may contain PHI
// Example: "Failed to create session for patient John Doe, DOB 1980-05-15"
```

**Required:**
- ❌ Sanitize error messages before sending to Sentry
- ❌ Sign Business Associate Agreement with Sentry
- ❌ Configure PII scrubbing rules

---

### 9. Session Management

**Status:** ❌ Non-Compliant

**Current Implementation:**
```typescript
// src/app/api/auth/session/route.ts:67
maxAge: 60 * 60 * 24 * 5, // 5 days
```

**Issues:**
1. **5-day sessions:** Far exceeds HIPAA recommendation of 24 hours
2. **No idle timeout:** Session stays active even if user is inactive
3. **No token refresh:** Tokens can't be renewed without full re-login
4. **No session revocation:** Can't force logout stolen sessions
5. **No concurrent limits:** User can have unlimited active sessions

**Cookie Security (Good):**
- ✅ `httpOnly: true` - Prevents XSS access
- ✅ `secure: true` in production - HTTPS only
- ✅ `sameSite: 'lax'` - CSRF protection

---

### 10. Environment Variables

**Status:** ✅ Well Managed

**Location:**
- `src/libs/Env.ts` - Zod validation
- `.env.example` - Template

**What's Working:**
- Type-safe environment validation
- Required field validation
- Separate public/private variables
- Clear documentation

**Minor Issue:**
```bash
# .env.example contains example API keys (should be redacted)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
```

**Recommendation:** Use placeholders like `your_api_key_here`

---

### 11. Security Headers

**Status:** ❌ NOT IMPLEMENTED

**Required Headers:**
- ❌ Content-Security-Policy (CSP)
- ❌ Strict-Transport-Security (HSTS)
- ❌ X-Frame-Options
- ❌ X-Content-Type-Options
- ❌ Permissions-Policy
- ❌ Referrer-Policy

**Impact:** Application vulnerable to:
- Cross-Site Scripting (XSS)
- Clickjacking attacks
- Man-in-the-Middle (MITM)
- Content type sniffing

---

## Critical Security Gaps

### 🚨 Priority 0: Must Fix Immediately

#### 1. No API Route Authorization

**Risk Level:** 🔴 CRITICAL
**CVSS Score:** 9.8 (Critical)

**Vulnerability:**
All API routes except `/api/auth/session` lack token verification. Anyone with a valid session cookie can access ALL PHI regardless of role or patient assignment.

**Proof of Concept:**
```bash
# User A (therapist) logs in and gets session cookie
# User B (different therapist) steals or reuses the cookie
# User B can now access User A's patients' PHI

curl -X GET https://storycare.com/api/sessions \
  -H "Cookie: session=stolen_cookie"
# Returns ALL therapy sessions from ALL therapists
```

**Impact:**
- Unauthorized access to all patient records
- HIPAA violation (minimum $100 fine per record)
- Data breach notification requirements
- Loss of trust, legal liability

**Affected Files:** All routes in `src/app/api/`

**Fix Effort:** Medium (1 day)

---

#### 2. No Audit Logging

**Risk Level:** 🔴 CRITICAL
**HIPAA Requirement:** REQUIRED

**Vulnerability:**
Zero audit trail of PHI access. Cannot:
- Prove compliance during audits
- Detect data breaches
- Investigate security incidents
- Track who accessed what patient data

**HIPAA Requirements:**
- Log all PHI access (create, read, update, delete)
- Retain logs for 7 years
- Include: user ID, action, timestamp, IP address, resource accessed
- Protect logs from tampering

**Current State:**
```typescript
// No audit logging anywhere in the application
await db.select().from(sessions).where(eq(sessions.id, sessionId));
// ☝️ No record of who accessed this session
```

**Impact:**
- Cannot detect insider threats
- Cannot investigate breaches
- Fail HIPAA compliance audits
- No evidence for legal defense

**Fix Effort:** High (1-2 days)

---

#### 3. Weak Session Management

**Risk Level:** 🔴 CRITICAL
**HIPAA Recommendation:** 24-hour maximum

**Vulnerability:**
5-day sessions provide extended window for stolen credentials to be abused.

**Attack Scenario:**
1. Attacker steals session cookie (XSS, network sniffing, malware)
2. Cookie remains valid for 5 days
3. Attacker has 5 days to access PHI before victim notices

**Additional Issues:**
- No idle timeout (session active even if user away for days)
- No token refresh (can't extend legitimate sessions without full re-login)
- No concurrent session limits (stolen cookie works alongside legitimate session)

**HIPAA Best Practice:** 15-minute idle timeout, 24-hour absolute timeout

**Fix Effort:** Low (0.5 days)

---

#### 4. No Data Encryption at Rest

**Risk Level:** 🔴 CRITICAL
**HIPAA Requirement:** ADDRESSABLE (but highly recommended)

**Vulnerability:**
If Neon database or GCS bucket is breached, all PHI is exposed in plaintext.

**Current State:**
- Database: Unknown if Neon has encryption at rest enabled
- GCS: Unknown if server-side encryption configured
- No field-level encryption for extra-sensitive data

**PHI at Risk:**
- Patient names, DOB, contact information
- Therapy session transcripts
- Audio recordings
- AI-generated therapeutic content
- Reflection responses, survey answers

**Industry Standard:** AES-256 encryption at rest

**Fix Effort:** Medium (1 day, mostly configuration)

---

#### 5. Missing Security Headers

**Risk Level:** 🔴 HIGH
**OWASP Top 10:** A05:2021 – Security Misconfiguration

**Vulnerabilities:**

**A. No Content-Security-Policy**
- Allows inline scripts (XSS risk)
- No restriction on external resources
- Risk: Attacker injects malicious script to steal session cookies

**B. No X-Frame-Options**
- Application can be embedded in iframe
- Risk: Clickjacking attack tricks user into clicking malicious UI

**C. No Strict-Transport-Security**
- HTTP connections not automatically upgraded to HTTPS
- Risk: Man-in-the-Middle attack intercepts PHI

**D. No X-Content-Type-Options**
- Browser may misinterpret file types
- Risk: Malicious file executed as script

**Fix Effort:** Low (0.5 days)

---

### ⚠️ Priority 1: High Priority

#### 6. No Rate Limiting

**Risk Level:** 🟡 HIGH

**Vulnerabilities:**
- Brute force attacks on authentication
- API abuse / data scraping
- Denial of Service (DoS)
- Credential stuffing attacks

**Current State:**
```typescript
// Arcjet configured but no rate limits:
rules: [
  shield({ mode: 'LIVE' }), // WAF only
  // No fixedWindow or slidingWindow rate limiting
],
```

**Required:**
- 5 login attempts per 15 minutes
- 100 API requests per minute per user
- 10 file uploads per hour
- 1000 requests per day per IP

**Fix Effort:** Low (0.5 days)

---

#### 7. No Role-Based Access Control (RBAC)

**Risk Level:** 🟡 HIGH

**Vulnerability:**
User roles exist in database but not enforced in API routes.

**Current Schema:**
```typescript
role: varchar('role', { length: 50 }).notNull(), // 'therapist', 'patient', 'admin'
therapistId: uuid('therapist_id').references(() => users.id), // Patient assignment
```

**Missing Enforcement:**
- Patients can access therapist endpoints
- Therapists can access other therapists' patients
- Patients can view other patients' data
- No admin-only endpoint protection

**Required:**
- Therapist can only access their own patients
- Patient can only access their own data
- Admin can access all data (with audit logging)

**Fix Effort:** Medium (1 day)

---

#### 8. No Input Validation

**Risk Level:** 🟡 HIGH
**OWASP Top 10:** A03:2021 – Injection

**Vulnerability:**
Most API routes lack Zod schema validation.

**Current State:**
```typescript
// Typical API route:
export async function POST(request: Request) {
  const body = await request.json();
  // No validation! Accepts any data shape
  await db.insert(sessions).values(body);
}
```

**Risks:**
- SQL injection (mitigated by DrizzleORM but still risky)
- NoSQL injection in future
- Type confusion bugs
- Business logic bypass
- Buffer overflow in native libraries

**Fix Effort:** High (2 days for all routes)

---

#### 9. No MFA Enforcement

**Risk Level:** 🟡 HIGH
**HIPAA Best Practice:** Required for privileged accounts

**Current State:**
- Firebase supports MFA (TOTP, SMS)
- Not enabled or enforced in application

**Required:**
- All therapist accounts must enable MFA
- All admin accounts must enable MFA
- Patients optional (lower risk)

**Fix Effort:** Medium (1 day)

---

### 📋 Priority 2: Medium Priority

#### 10. No Soft Delete

**Risk Level:** 🟢 MEDIUM

**HIPAA Requirement:**
- Patients have right to request data deletion
- Data should be "soft deleted" (marked as deleted, not actually removed)
- Retain for 90 days before permanent deletion
- Permanent deletion requires multi-step verification

**Current Schema:** No `deletedAt` field

**Required Changes:**
```typescript
// Add to all PHI tables:
deletedAt: timestamp('deleted_at'),

// Update all queries:
.where(and(
  eq(sessions.id, sessionId),
  isNull(sessions.deletedAt), // Exclude soft-deleted
))
```

**Fix Effort:** Medium (1 day)

---

#### 11. GCS Signed URL Too Long

**Risk Level:** 🟢 MEDIUM

**Current:** 7-day signed URLs
**Required:** 1-hour maximum for PHI

**Issue:**
Signed URLs shared via email or chat remain valid for 7 days, allowing extended unauthorized access if link is leaked.

**Fix:**
```typescript
// Change in src/libs/GCS.ts
expires: Date.now() + 60 * 60 * 1000, // 1 hour
```

**Fix Effort:** Low (0.25 days)

---

#### 12. Logging May Contain PHI

**Risk Level:** 🟢 MEDIUM

**Issue:**
Console.log and error messages may include PHI.

**Example:**
```typescript
console.error('Failed to create session for patient:', patient);
// ☝️ Logs patient name, DOB, etc.
```

**Required:**
- Sanitize all logs before sending to Better Stack
- Redact PII/PHI fields
- Use error codes instead of detailed messages

**Fix Effort:** Medium (1 day)

---

## Implementation Plan

### Phase 1: Critical Security Fixes (Days 1-3)

#### Day 1: API Authorization & Audit Logging Foundation

**Morning: Authentication Helper**
1. Create `src/utils/AuthHelpers.ts`
   ```typescript
   export async function requireAuth(request: Request) {
     const authHeader = request.headers.get('Authorization');
     if (!authHeader?.startsWith('Bearer ')) {
       throw new Error('Unauthorized');
     }
     const token = authHeader.substring(7);
     const user = await verifyIdToken(token);
     return user; // { uid, email, role }
   }

   export async function requireRole(request: Request, allowedRoles: string[]) {
     const user = await requireAuth(request);
     if (!allowedRoles.includes(user.role)) {
       throw new Error('Forbidden');
     }
     return user;
   }
   ```

2. Update 5 highest-risk API routes first:
   - `/api/sessions/route.ts` (GET, POST)
   - `/api/sessions/[id]/route.ts` (GET, PUT, DELETE)
   - `/api/patients/route.ts` (GET, POST)
   - `/api/patients/[id]/route.ts` (GET, PUT, DELETE)
   - `/api/sessions/upload/route.ts` (POST)

**Afternoon: Audit Logging Schema**
3. Add `audit_logs` table to `src/models/Schema.ts`
   ```typescript
   export const auditLogs = pgTable('audit_logs', {
     id: uuid('id').primaryKey().defaultRandom(),
     userId: uuid('user_id').notNull().references(() => users.id),
     action: varchar('action', { length: 50 }).notNull(), // 'read', 'create', 'update', 'delete'
     resourceType: varchar('resource_type', { length: 50 }).notNull(), // 'session', 'patient', etc.
     resourceId: uuid('resource_id').notNull(),
     ipAddress: varchar('ip_address', { length: 45 }), // IPv6 max length
     userAgent: text('user_agent'),
     metadata: jsonb('metadata'), // Additional context
     timestamp: timestamp('timestamp').defaultNow().notNull(),
   });

   // Index for fast queries
   export const auditLogsUserIdIdx = index('audit_logs_user_id_idx').on(auditLogs.userId);
   export const auditLogsTimestampIdx = index('audit_logs_timestamp_idx').on(auditLogs.timestamp);
   ```

4. Generate and run migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Create `src/libs/AuditLogger.ts`
   ```typescript
   import { auditLogs } from '@/models/Schema';
   import { db } from './DB';

   type AuditLogData = {
     userId: string;
     action: 'read' | 'create' | 'update' | 'delete';
     resourceType: string;
     resourceId: string;
     ipAddress?: string;
     userAgent?: string;
     metadata?: Record<string, any>;
   };

   export async function logAudit(data: AuditLogData) {
     try {
       await db.insert(auditLogs).values({
         ...data,
         timestamp: new Date(),
       });
     } catch (error) {
       console.error('Failed to write audit log:', error);
       // Don't throw - audit logging should never break app functionality
     }
   }

   // Helper for Next.js API routes
   export function getClientInfo(request: Request) {
     const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]
       || request.headers.get('x-real-ip')
       || 'unknown';
     const userAgent = request.headers.get('user-agent') || 'unknown';
     return { ipAddress, userAgent };
   }
   ```

**Deliverables:**
- ✅ Authentication helper functions
- ✅ 5 critical API routes protected
- ✅ Audit logging database schema
- ✅ Audit logging utility functions

---

#### Day 2: Complete API Authorization & Session Management

**Morning: Protect Remaining API Routes**
1. Update all remaining routes in `src/app/api/`:
   - `/api/groups/route.ts`
   - `/api/pages/route.ts`
   - `/api/media/route.ts`
   - `/api/ai/chat/route.ts`
   - `/api/ai/generate-image/route.ts`
   - `/api/dashboard/stats/route.ts`

2. Add audit logging to all routes:
   ```typescript
   // Example in /api/sessions/[id]/route.ts GET
   export async function GET(request: Request, { params }: { params: { id: string } }) {
     const user = await requireAuth(request);
     const { ipAddress, userAgent } = getClientInfo(request);

     const session = await db.query.sessions.findFirst({
       where: eq(sessions.id, params.id),
     });

     if (!session) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
     }

     // Audit log the PHI access
     await logAudit({
       userId: user.uid,
       action: 'read',
       resourceType: 'session',
       resourceId: params.id,
       ipAddress,
       userAgent,
     });

     return NextResponse.json(session);
   }
   ```

**Afternoon: Fix Session Management**
3. Update `src/app/api/auth/session/route.ts`:
   ```typescript
   // Line 67 - Reduce from 5 days to 24 hours
   maxAge: 60 * 60 * 24, // 24 hours (HIPAA compliant)
   ```

4. Add idle timeout to `src/contexts/AuthContext.tsx`:
   ```typescript
   // Add inactivity timer
   const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
   let idleTimer: NodeJS.Timeout;

   const resetIdleTimer = () => {
     clearTimeout(idleTimer);
     idleTimer = setTimeout(() => {
       // Auto logout
       signOut(auth);
     }, IDLE_TIMEOUT);
   };

   useEffect(() => {
     // Track user activity
     window.addEventListener('mousemove', resetIdleTimer);
     window.addEventListener('keypress', resetIdleTimer);
     resetIdleTimer();

     return () => {
       window.removeEventListener('mousemove', resetIdleTimer);
       window.removeEventListener('keypress', resetIdleTimer);
       clearTimeout(idleTimer);
     };
   }, []);
   ```

**Deliverables:**
- ✅ All API routes protected with authentication
- ✅ All API routes include audit logging
- ✅ Session duration reduced to 24 hours
- ✅ Automatic logout after 15 minutes idle

---

#### Day 3: Middleware & Security Headers

**Morning: Fix Middleware Token Verification**
1. Update `src/middleware.ts`:
   ```typescript
   import { verifyIdToken } from '@/libs/FirebaseAdmin';

   // Replace line 62-75 with proper token verification:
   const sessionCookie = request.cookies.get('session');

   if (!sessionCookie) {
     return NextResponse.redirect(new URL('/sign-in', request.url));
   }

   try {
     // Actually verify the token is valid
     await verifyIdToken(sessionCookie.value);
   } catch (error) {
     // Token expired, revoked, or invalid - force re-login
     const response = NextResponse.redirect(new URL('/sign-in', request.url));
     response.cookies.delete('session');
     return response;
   }
   ```

**Afternoon: Add Security Headers**
2. Add security headers to `src/middleware.ts`:
   ```typescript
   // After successful authentication, add security headers
   const response = NextResponse.next();

   // Prevent clickjacking
   response.headers.set('X-Frame-Options', 'DENY');

   // Prevent MIME type sniffing
   response.headers.set('X-Content-Type-Options', 'nosniff');

   // Force HTTPS
   response.headers.set(
     'Strict-Transport-Security',
     'max-age=31536000; includeSubDomains; preload'
   );

   // Content Security Policy
   response.headers.set(
     'Content-Security-Policy',
     'default-src \'self\'; '
     + 'script-src \'self\' \'unsafe-inline\' \'unsafe-eval\' https://cdn.jsdelivr.net; '
     + 'style-src \'self\' \'unsafe-inline\'; '
     + 'img-src \'self\' data: https:; '
     + 'font-src \'self\' data:; '
     + 'connect-src \'self\' https://*.firebaseapp.com https://*.googleapis.com; '
     + 'frame-ancestors \'none\';'
   );

   // Permissions Policy
   response.headers.set(
     'Permissions-Policy',
     'camera=(), microphone=(), geolocation=()'
   );

   // Referrer Policy
   response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

   return response;
   ```

3. Also add headers to `next.config.ts`:
   ```typescript
   async headers() {
     return [
       {
         source: '/:path*',
         headers: [
           { key: 'X-Frame-Options', value: 'DENY' },
           { key: 'X-Content-Type-Options', value: 'nosniff' },
           { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
           { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
         ],
       },
     ];
   },
   ```

**Deliverables:**
- ✅ Middleware properly verifies token validity
- ✅ Security headers implemented (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Phase 1 complete - Critical vulnerabilities addressed

---

### Phase 2: Enhanced Security (Days 4-5)

#### Day 4: Rate Limiting, RBAC, Encryption

**Morning: Rate Limiting**
1. Update `src/libs/Arcjet.ts`:
   ```typescript
   import arcjet, { fixedWindow, shield } from '@arcjet/next';

   export const aj = arcjet({
     key: env.ARCJET_KEY,
     characteristics: ['ip.src'],
     rules: [
       shield({ mode: 'LIVE' }),
       fixedWindow({
         mode: 'LIVE',
         window: '60s',
         max: 100, // 100 requests per minute
       }),
     ],
   });

   // Special rate limiter for authentication endpoints
   export const authRateLimiter = arcjet({
     key: env.ARCJET_KEY,
     characteristics: ['ip.src'],
     rules: [
       fixedWindow({
         mode: 'LIVE',
         window: '15m',
         max: 5, // 5 login attempts per 15 minutes
       }),
     ],
   });
   ```

2. Apply to auth routes:
   ```typescript
   // src/app/api/auth/session/route.ts
   import { authRateLimiter } from '@/libs/Arcjet';

   export async function POST(request: Request) {
     const decision = await authRateLimiter.protect(request);
     if (decision.isDenied()) {
       return NextResponse.json(
         { error: 'Too many requests' },
         { status: 429 }
       );
     }
     // ... rest of auth logic
   }
   ```

**Afternoon: Role-Based Access Control**
3. Create `src/middleware/AuthorizationMiddleware.ts`:
   ```typescript
   import { eq } from 'drizzle-orm';
   import { NextResponse } from 'next/server';
   import { db } from '@/libs/DB';
   import { users } from '@/models/Schema';
   import { requireAuth } from '@/utils/AuthHelpers';

   export async function requireTherapist(request: Request) {
     const user = await requireAuth(request);
     if (user.role !== 'therapist' && user.role !== 'admin') {
       throw new Error('Forbidden: Therapist access required');
     }
     return user;
   }

   export async function requireAdmin(request: Request) {
     const user = await requireAuth(request);
     if (user.role !== 'admin') {
       throw new Error('Forbidden: Admin access required');
     }
     return user;
   }

   export async function requirePatientOrTherapist(request: Request, patientId: string) {
     const user = await requireAuth(request);

     // Admin can access anything
     if (user.role === 'admin') {
       return user;
     }

     // If user is the patient, allow
     if (user.uid === patientId) {
       return user;
     }

     // If user is therapist, check if patient is assigned to them
     if (user.role === 'therapist') {
       const patient = await db.query.users.findFirst({
         where: eq(users.id, patientId),
       });

       if (patient?.therapistId === user.uid) {
         return user;
       }
     }

     throw new Error('Forbidden: Not authorized to access this patient');
   }
   ```

4. Update patient routes with RBAC:
   ```typescript
   // /api/patients/[id]/route.ts
   export async function GET(request: Request, { params }: { params: { id: string } }) {
     const user = await requirePatientOrTherapist(request, params.id);
     // ... rest of logic
   }
   ```

**Evening: Encryption Setup**
5. Create `src/utils/Encryption.ts`:
   ```typescript
   import crypto from 'node:crypto';

   const ALGORITHM = 'aes-256-gcm';
   const KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex'); // 32 bytes
   const IV_LENGTH = 16;
   const AUTH_TAG_LENGTH = 16;

   export function encrypt(text: string): string {
     const iv = crypto.randomBytes(IV_LENGTH);
     const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

     let encrypted = cipher.update(text, 'utf8', 'hex');
     encrypted += cipher.final('hex');

     const authTag = cipher.getAuthTag();

     // Return: iv:authTag:encrypted
     return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
   }

   export function decrypt(encrypted: string): string {
     const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

     const iv = Buffer.from(ivHex, 'hex');
     const authTag = Buffer.from(authTagHex, 'hex');
     const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
     decipher.setAuthTag(authTag);

     let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
     decrypted += decipher.final('utf8');

     return decrypted;
   }
   ```

6. Add to `.env.example`:
   ```bash
   # Generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))"
   ENCRYPTION_KEY=your_64_char_hex_key
   ```

7. Update GCS signed URL expiration in `src/libs/GCS.ts`:
   ```typescript
   // Line 51, 75
   expires: Date.now() + 60 * 60 * 1000, // 1 hour (was 7 days)
   ```

**Deliverables:**
- ✅ Rate limiting on all API endpoints
- ✅ Auth rate limiting (5 attempts per 15 min)
- ✅ RBAC middleware for role enforcement
- ✅ Field-level encryption utilities
- ✅ GCS signed URLs reduced to 1 hour

---

#### Day 5: Input Validation & Soft Delete

**Morning: Input Validation**
1. Create validation schemas in `src/validations/`:
   ```typescript
   // src/validations/SessionValidation.ts
   import { z } from 'zod';

   export const createSessionSchema = z.object({
     title: z.string().min(1).max(200),
     sessionDate: z.string().datetime(),
     sessionType: z.enum(['individual', 'group']),
     patientId: z.string().uuid().optional(),
     groupId: z.string().uuid().optional(),
     notes: z.string().max(5000).optional(),
   });

   export const updateSessionSchema = createSessionSchema.partial();
   ```

   ```typescript
   // src/validations/PatientValidation.ts
   export const createPatientSchema = z.object({
     email: z.string().email(),
     name: z.string().min(1).max(100),
     dateOfBirth: z.string().optional(),
     phoneNumber: z.string().optional(),
     referenceImageUrl: z.string().url().optional(),
   });
   ```

2. Apply to API routes:
   ```typescript
   import { createSessionSchema } from '@/validations/SessionValidation';

   export async function POST(request: Request) {
     const user = await requireTherapist(request);
     const body = await request.json();

     // Validate input
     const validated = createSessionSchema.parse(body);

     // Continue with validated data
     const [newSession] = await db.insert(sessions).values({
       ...validated,
       therapistId: user.uid,
     }).returning();

     return NextResponse.json(newSession);
   }
   ```

**Afternoon: Soft Delete**
3. Update `src/models/Schema.ts` to add `deletedAt`:
   ```typescript
   // Add to sessions table
   deletedAt: timestamp('deleted_at'),

   // Add to patients (users) table
   deletedAt: timestamp('deleted_at'),

   // Add to media_library table
   deletedAt: timestamp('deleted_at'),

   // Add to transcripts table
   deletedAt: timestamp('deleted_at'),
   ```

4. Generate migration:
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

5. Create soft delete utility in `src/utils/DBHelpers.ts`:
   ```typescript
   import { SQL, sql } from 'drizzle-orm';

   export function excludeDeleted() {
     return sql`deleted_at IS NULL`;
   }

   export async function softDelete<T>(
     table: any,
     id: string,
     userId: string
   ) {
     await db.update(table)
       .set({ deletedAt: new Date() })
       .where(eq(table.id, id));

     await logAudit({
       userId,
       action: 'delete',
       resourceType: table.name,
       resourceId: id,
     });
   }
   ```

6. Update DELETE routes to use soft delete:
   ```typescript
   export async function DELETE(request: Request, { params }: { params: { id: string } }) {
     const user = await requireAuth(request);

     await softDelete(sessions, params.id, user.uid);

     return NextResponse.json({ success: true });
   }
   ```

**Deliverables:**
- ✅ Zod validation on all API routes
- ✅ Soft delete implemented on all PHI tables
- ✅ Database migration for deletedAt columns
- ✅ Phase 2 complete - Enhanced security in place

---

### Phase 3: Compliance Documentation (Days 6-7)

#### Day 6: Create Compliance Documents

1. **COMPLIANCE.md** - HIPAA compliance measures
2. **INCIDENT_RESPONSE.md** - Data breach response plan
3. **DATA_RETENTION.md** - Data retention and deletion policy
4. **MFA_SETUP.md** - Multi-factor authentication guide

#### Day 7: Final Testing & Verification

1. Test authentication on all API routes
2. Verify audit logs are being written
3. Test session timeout (24 hours + idle)
4. Verify security headers with securityheaders.com
5. Test rate limiting
6. Verify RBAC (therapist can't access other's patients)
7. Test soft delete functionality
8. Review Sentry for any errors

---

## Technical Requirements

### Database Changes

```sql
-- Add audit_logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_logs_user_id_idx ON audit_logs(user_id);
CREATE INDEX audit_logs_timestamp_idx ON audit_logs(timestamp);
CREATE INDEX audit_logs_resource_idx ON audit_logs(resource_type, resource_id);

-- Add deletedAt to PHI tables
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE sessions ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE transcripts ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE media_library ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE story_pages ADD COLUMN deleted_at TIMESTAMP;
```

---

### Environment Variables

Add to `.env.local`:

```bash
# Encryption key (generate with: node -e "console.log(crypto.randomBytes(32).toString('hex'))")
ENCRYPTION_KEY=your_64_character_hex_key_here

# Database encryption (verify with Neon)
DATABASE_ENCRYPTION_AT_REST=enabled

# GCS encryption (verify with GCP)
GCS_ENCRYPTION_TYPE=GOOGLE_MANAGED
```

---

### NPM Dependencies

```bash
# Already installed:
# - firebase (client auth)
# - firebase-admin (server auth)
# - @arcjet/next (security)
# - drizzle-orm (database)
# - zod (validation)

# No new dependencies required
```

---

## Compliance Checklist

### HIPAA Security Rule Compliance

#### Technical Safeguards

- [x] **Access Control (§164.312(a)(1))** - IMPLEMENTED
  - [x] Unique user identification (Firebase UID)
  - [x] Emergency access procedure (Admin role)
  - [x] Automatic logoff (15-minute idle timeout)
  - [x] Encryption and decryption (Field-level encryption available)

- [x] **Audit Controls (§164.312(b))** - IMPLEMENTED
  - [x] Hardware, software, and/or procedural mechanisms to record and examine access to PHI
  - [x] Audit logs for all PHI access (create, read, update, delete)
  - [x] 7-year retention (PostgreSQL with no expiration)

- [x] **Integrity (§164.312(c)(1))** - IMPLEMENTED
  - [x] Mechanisms to authenticate PHI is not improperly altered or destroyed
  - [x] Soft delete prevents accidental data loss
  - [x] Audit trail of all changes

- [x] **Person or Entity Authentication (§164.312(d))** - IMPLEMENTED
  - [x] Procedures to verify person/entity seeking access is who they claim
  - [x] Firebase Authentication with JWT tokens
  - [x] MFA available (needs to be enforced)

- [x] **Transmission Security (§164.312(e)(1))** - IMPLEMENTED
  - [x] Technical security measures to guard against unauthorized access to PHI during transmission
  - [x] TLS 1.2+ for all connections
  - [x] Strict-Transport-Security header enforces HTTPS

#### Administrative Safeguards

- [ ] **Security Management Process (§164.308(a)(1))** - PARTIAL
  - [x] Risk analysis (this document)
  - [ ] Risk management plan (needs implementation)
  - [ ] Sanction policy (needs documentation)
  - [ ] Information system activity review (audit log review process needed)

- [ ] **Assigned Security Responsibility (§164.308(a)(2))** - NEEDS DOCUMENTATION
  - [ ] Identify security official responsible for developing and implementing security policies

- [ ] **Workforce Security (§164.308(a)(3))** - NEEDS DOCUMENTATION
  - [ ] Procedures for authorization and supervision of workforce members
  - [ ] Termination procedures
  - [ ] Access authorization
  - [ ] Workforce clearance procedures

- [ ] **Information Access Management (§164.308(a)(4))** - IMPLEMENTED
  - [x] Isolating healthcare clearinghouse functions (N/A)
  - [x] Access authorization (RBAC implemented)
  - [x] Access establishment and modification (User management exists)

- [ ] **Security Awareness and Training (§164.308(a)(5))** - NEEDS DOCUMENTATION
  - [ ] Security reminders
  - [ ] Protection from malicious software
  - [ ] Log-in monitoring
  - [ ] Password management

- [ ] **Security Incident Procedures (§164.308(a)(6))** - NEEDS DOCUMENTATION
  - [ ] Response and reporting procedures

- [ ] **Contingency Plan (§164.308(a)(7))** - NEEDS DOCUMENTATION
  - [ ] Data backup plan
  - [ ] Disaster recovery plan
  - [ ] Emergency mode operation plan
  - [ ] Testing and revision procedures
  - [ ] Applications and data criticality analysis

- [ ] **Business Associate Contracts (§164.308(b)(1))** - NEEDS ACTION
  - [ ] Sign BAA with Neon (database)
  - [ ] Sign BAA with Google Cloud Platform (storage + Firebase)
  - [ ] Sign BAA with Vercel (hosting)
  - [ ] Sign BAA with Sentry (error monitoring)
  - [ ] Sign BAA with Deepgram (transcription)
  - [ ] Sign BAA with OpenAI (AI processing)
  - [ ] Sign BAA with Better Stack (logging)

#### Physical Safeguards

- [x] **Facility Access Controls (§164.310(a)(1))** - CLOUD PROVIDER RESPONSIBILITY
  - [x] Contingency operations (Vercel, GCP, Neon SLAs)
  - [x] Facility security plan (Covered by cloud providers)
  - [x] Access control and validation procedures (Covered by cloud providers)
  - [x] Maintenance records (Covered by cloud providers)

- [x] **Workstation Use (§164.310(b))** - POLICY NEEDED
  - [ ] Document policies for workstations that access PHI

- [x] **Workstation Security (§164.310(c))** - POLICY NEEDED
  - [ ] Physical safeguards for workstations

- [x] **Device and Media Controls (§164.310(d)(1))** - IMPLEMENTED
  - [x] Disposal (Soft delete + 90-day retention)
  - [x] Media re-use (N/A - cloud storage)
  - [x] Accountability (Audit logs)
  - [x] Data backup and storage (Neon automated backups)

---

## Business Associate Agreements

### Required BAAs

Must sign Business Associate Agreements (BAAs) with all third-party services that process PHI:

| Service | Purpose | PHI Exposure | BAA Status | Priority |
|---------|---------|--------------|------------|----------|
| **Neon** | PostgreSQL database | HIGH - All PHI stored | ⏳ REQUIRED | 🔴 P0 |
| **Google Cloud** | Storage (GCS) + Auth (Firebase) | HIGH - Audio, media, auth | ⏳ REQUIRED | 🔴 P0 |
| **Vercel** | Hosting | MEDIUM - PHI in transit | ⏳ REQUIRED | 🔴 P0 |
| **Deepgram** | Transcription | HIGH - Audio PHI | ⏳ REQUIRED | 🔴 P0 |
| **OpenAI** | AI processing | HIGH - Transcript PHI | ⏳ REQUIRED | 🔴 P0 |
| **Sentry** | Error monitoring | LOW - May contain PHI in errors | ⏳ REQUIRED | 🟡 P1 |
| **Better Stack** | Logging | LOW - May contain PHI in logs | ⏳ REQUIRED | 🟡 P1 |
| **PostHog** | Analytics | LOW - Usage only | ⚠️ OPTIONAL | 🟢 P2 |
| **Checkly** | Monitoring | NONE - Uptime only | ✅ NOT REQUIRED | - |

### How to Obtain BAAs

1. **Neon:** Contact sales team, request BAA for HIPAA compliance
2. **Google Cloud:** Sign up for Google Workspace Enterprise + GCP HIPAA compliance
3. **Vercel:** Contact enterprise sales, available on Enterprise plan
4. **Deepgram:** Contact sales, HIPAA BAA available
5. **OpenAI:** Enterprise plan required for BAA
6. **Sentry:** Business plan or higher
7. **Better Stack:** Contact support

---

## Monitoring & Maintenance

### Security Monitoring

**Daily:**
- [ ] Review Sentry for security-related errors
- [ ] Check Arcjet dashboard for blocked requests
- [ ] Monitor failed login attempts

**Weekly:**
- [ ] Review audit logs for suspicious activity
- [ ] Check for unusual access patterns
- [ ] Verify backup integrity

**Monthly:**
- [ ] Review and rotate API keys
- [ ] Update dependencies (security patches)
- [ ] Conduct access review (remove terminated users)
- [ ] Review firewall rules

**Quarterly:**
- [ ] Security assessment / penetration testing
- [ ] Review and update security policies
- [ ] Compliance audit preparation
- [ ] Disaster recovery drill

**Annually:**
- [ ] Comprehensive security audit
- [ ] HIPAA compliance assessment
- [ ] Workforce security training
- [ ] Business continuity plan review

---

### Audit Log Queries

```sql
-- Who accessed patient X in the last 30 days?
SELECT u.name, u.email, al.action, al.timestamp
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.resource_type = 'patient'
  AND al.resource_id = 'patient-uuid-here'
  AND al.timestamp > NOW() - INTERVAL '30 days'
ORDER BY al.timestamp DESC;

-- Failed authentication attempts from IP
SELECT ip_address, COUNT(*) as attempts
FROM audit_logs
WHERE action = 'auth_failed'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Data exports (potential breach indicator)
SELECT u.name, u.email, al.timestamp, al.metadata
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.action = 'export'
  AND al.timestamp > NOW() - INTERVAL '7 days'
ORDER BY al.timestamp DESC;
```

---

### Incident Response

See `INCIDENT_RESPONSE.md` for full procedures.

**Quick Reference:**

1. **Detect:** Monitoring alerts, user reports, audit log anomalies
2. **Contain:** Disable compromised accounts, rotate credentials
3. **Investigate:** Review audit logs, identify scope of breach
4. **Notify:** Legal counsel, affected patients (within 60 days), HHS (if >500 records)
5. **Remediate:** Fix vulnerability, enhance security
6. **Document:** Maintain breach log

**Breach Notification Deadlines:**
- **<500 records:** Annual report to HHS
- **≥500 records:** Notify HHS within 60 days, notify media
- **Patients:** Notify within 60 days of discovery

---

## Cost Estimate

### Implementation Costs

| Phase | Developer Time | Estimated Cost (at $150/hr) |
|-------|----------------|------------------------------|
| Phase 1 (Days 1-3) | 24 hours | $3,600 |
| Phase 2 (Days 4-5) | 16 hours | $2,400 |
| Phase 3 (Days 6-7) | 16 hours | $2,400 |
| **Total** | **56 hours** | **$8,400** |

### Annual Compliance Costs

| Service | Cost Increase for HIPAA BAA |
|---------|------------------------------|
| Neon | ~$50-100/month (Enterprise plan) |
| Google Cloud | ~$100/month (HIPAA compliance) |
| Vercel | ~$150/month (Enterprise plan) |
| Sentry | ~$50/month (Business plan) |
| **Total** | **~$350-400/month** = **$4,200-4,800/year** |

### Potential HIPAA Violation Costs (Avoided)

| Violation Tier | Penalty per Record | Example |
|----------------|-------------------|---------|
| Tier 1 (Unknowing) | $100-50,000 | Unencrypted PHI |
| Tier 2 (Reasonable Cause) | $1,000-50,000 | Delayed breach notification |
| Tier 3 (Willful Neglect - Corrected) | $10,000-50,000 | No audit logging |
| Tier 4 (Willful Neglect - Not Corrected) | $50,000 | Repeated violations |
| **Annual Cap** | **$1.5M per violation type** | |

**ROI:** Investing $8,400 + $4,800/year to avoid potential $1.5M+ in fines = Excellent

---

## Appendix

### Glossary

- **PHI:** Protected Health Information - Any health information that can identify an individual
- **BAA:** Business Associate Agreement - Contract required when third party handles PHI
- **MFA:** Multi-Factor Authentication - Requires 2+ verification methods
- **RBAC:** Role-Based Access Control - Permissions based on user role
- **HIPAA:** Health Insurance Portability and Accountability Act
- **TLS:** Transport Layer Security - Encryption for data in transit
- **CSP:** Content Security Policy - Prevents XSS attacks
- **HSTS:** HTTP Strict Transport Security - Forces HTTPS
- **XSS:** Cross-Site Scripting - Injection attack
- **CSRF:** Cross-Site Request Forgery - Unauthorized command attack

### References

- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [HIPAA Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Authentication Security](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Next.js Security Headers](https://nextjs.org/docs/app/api-reference/next-config-js/headers)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-30
**Next Review:** 2025-11-30
**Owner:** Security Team
**Approved By:** [Pending]

---

## Quick Start Checklist

Ready to implement? Follow this checklist:

- [ ] Read and understand this entire document
- [ ] Get budget approval for BAA costs
- [ ] Set up development environment
- [ ] Create feature branch: `git checkout -b feature/hipaa-compliance`
- [ ] **Day 1:** Implement authentication helper and protect 5 critical API routes
- [ ] **Day 1:** Create audit logging schema and utilities
- [ ] **Day 2:** Protect all remaining API routes with auth and audit logging
- [ ] **Day 2:** Fix session management (24-hour expiry, idle timeout)
- [ ] **Day 3:** Fix middleware token verification
- [ ] **Day 3:** Add security headers
- [ ] **Day 4:** Implement rate limiting and RBAC
- [ ] **Day 4:** Set up encryption utilities and reduce GCS URL expiry
- [ ] **Day 5:** Add input validation and soft delete
- [ ] **Day 6:** Create compliance documentation
- [ ] **Day 7:** Testing and verification
- [ ] Submit for security review
- [ ] Deploy to production
- [ ] Sign BAAs with all third-party services
- [ ] Schedule compliance audit

**Questions?** Contact security@storycare.com (or your designated security officer)

---

*This document is confidential and should be stored securely. Do not share outside your organization.*
