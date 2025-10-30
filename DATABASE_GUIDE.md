# Database Setup & Migration Guide

This guide covers everything you need to know about managing the database for StoryCare, including Drizzle ORM setup, migrations, and working with the schema.

## Table of Contents

1. [Database Overview](#database-overview)
2. [Local Development Setup](#local-development-setup)
3. [Understanding the Schema](#understanding-the-schema)
4. [Generating Migrations](#generating-migrations)
5. [Running Migrations](#running-migrations)
6. [Drizzle Studio](#drizzle-studio)
7. [Common Database Operations](#common-database-operations)
8. [Production Setup](#production-setup)
9. [Schema Updates Workflow](#schema-updates-workflow)
10. [Troubleshooting](#troubleshooting)

---

## Database Overview

### Current Stack
- **ORM**: DrizzleORM (type-safe SQL)
- **Local Development**: PGlite (in-memory/file-based PostgreSQL)
- **Production**: Neon (serverless PostgreSQL)
- **Migrations**: Drizzle Kit

### Why This Stack?
- **PGlite**: No Docker needed, automatic with `npm run dev`
- **DrizzleORM**: Type-safe queries, excellent TypeScript support
- **Neon**: Serverless, scales automatically, generous free tier

### Database Architecture

**StoryCare** has 15 main tables organized into logical groups:

1. **Users & Auth**: `users`
2. **Groups**: `groups`, `group_members`
3. **Sessions**: `sessions`, `transcripts`, `speakers`, `utterances`
4. **Media**: `media_library`, `quotes`, `notes`
5. **Scenes**: `scenes`, `scene_clips`
6. **Story Pages**: `story_pages`, `page_blocks`, `reflection_questions`, `survey_questions`
7. **Responses**: `reflection_responses`, `survey_responses`, `patient_page_interactions`

---

## Local Development Setup

### Step 1: Verify Dependencies
Your `package.json` already has all required packages:
```json
{
  "dependencies": {
    "drizzle-orm": "^0.44.7",
    "pg": "^8.16.3"
  },
  "devDependencies": {
    "@electric-sql/pglite-socket": "^0.0.16",
    "drizzle-kit": "^0.31.6"
  }
}
```

### Step 2: Configuration Files

**drizzle.config.ts** (Already configured ✅):
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/models/Schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  verbose: true,
  strict: true,
});
```

**src/libs/DB.ts** (Already configured ✅):
```typescript
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from '@/models/Schema';
import { createDbConnection } from '@/utils/DBConnection';
import { Env } from './Env';

const globalForDb = globalThis as unknown as {
  drizzle: NodePgDatabase<typeof schema>;
};

const db = globalForDb.drizzle || createDbConnection();

if (Env.NODE_ENV !== 'production') {
  globalForDb.drizzle = db;
}

export { db };
```

**src/utils/DBConnection.ts** (Already configured ✅):
```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Env } from '@/libs/Env';
import * as schema from '@/models/Schema';

export const createDbConnection = () => {
  const pool = new Pool({
    connectionString: Env.DATABASE_URL,
    max: 1,
  });

  return drizzle({
    client: pool,
    schema,
  });
};
```

### Step 3: Environment Variables

**For local development**, `.env.local`:
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
```

PGlite automatically starts when you run `npm run dev` and uses this connection string.

---

## Understanding the Schema

### Schema Structure (`src/models/Schema.ts`)

Your schema is organized into logical sections:

#### 1. Enums (Reusable Types)
```typescript
export const userRoleEnum = pgEnum('user_role', ['therapist', 'patient', 'admin']);
export const sessionTypeEnum = pgEnum('session_type', ['individual', 'group']);
export const transcriptionStatusEnum = pgEnum('transcription_status', [
  'pending', 'processing', 'completed', 'failed'
]);
// ... and 8 more enums
```

#### 2. Core Tables

**Users Table**:
```typescript
export const usersSchema = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: userRoleEnum('role').notNull(),
  firebaseUid: varchar('firebase_uid', { length: 255 }).unique(),
  // ... more fields
});
```

**Sessions Table**:
```typescript
export const sessionsSchema = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  sessionDate: date('session_date').notNull(),
  therapistId: uuid('therapist_id').references(() => usersSchema.id).notNull(),
  audioUrl: text('audio_url').notNull(),
  transcriptionStatus: transcriptionStatusEnum('transcription_status').default('pending'),
  // ... more fields
});
```

#### 3. Type Exports (For TypeScript)
```typescript
export type User = typeof usersSchema.$inferSelect;
export type NewUser = typeof usersSchema.$inferInsert;

export type Session = typeof sessionsSchema.$inferSelect;
export type NewSession = typeof sessionsSchema.$inferInsert();
```

---

## Generating Migrations

### When to Generate Migrations?

Generate a new migration whenever you:
- Add a new table
- Add/remove columns
- Change column types
- Add/modify constraints
- Add/modify enums
- Add indexes

### How to Generate

```bash
npm run db:generate
```

This command:
1. Reads `src/models/Schema.ts`
2. Compares with existing migrations
3. Generates SQL in `migrations/` folder
4. Creates a new timestamped migration file

**Example Output**:
```
📦 Generating migrations...
✅ Done!
📄 Generated: migrations/0001_add_prompts_table.sql
```

### Viewing Generated SQL

Check the generated migration in `migrations/`:
```sql
-- migrations/0001_add_prompts_table.sql
CREATE TABLE IF NOT EXISTS "prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "therapist_id" uuid NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "prompts" ADD CONSTRAINT "prompts_therapist_id_fkey"
FOREIGN KEY ("therapist_id") REFERENCES "users"("id") ON DELETE CASCADE;
```

---

## Running Migrations

### Apply Migrations to Database

```bash
npm run db:migrate
```

This command:
1. Connects to database (PGlite locally, Neon in production)
2. Checks which migrations have been applied
3. Runs pending migrations in order
4. Updates migration journal

**Example Output**:
```
🔍 Checking migrations...
📝 Applying migration: 0001_add_prompts_table
✅ Migration complete!
```

### What Happens Behind the Scenes?

1. **Creates `__drizzle_migrations` table** (if not exists)
2. **Tracks applied migrations** in journal
3. **Executes SQL statements** from migration files
4. **Rolls back on error** (transaction-based)

### Migration Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

---

## Drizzle Studio

### What is Drizzle Studio?

Drizzle Studio is a visual database browser built into Drizzle Kit.

### Launch Studio

```bash
npm run db:studio
```

Opens browser at: `https://local.drizzle.studio`

### Features

- **Browse Tables**: View all tables and data
- **Edit Data**: Add/update/delete records visually
- **View Relationships**: See foreign key connections
- **Run Queries**: Execute custom SQL
- **Schema Visualization**: Understand table structure

### Use Cases

- **Inspect data** during development
- **Add test data** manually
- **Debug queries** and relationships
- **Verify migrations** applied correctly

---

## Common Database Operations

### 1. Querying Data

**Simple Select**:
```typescript
import { db } from '@/libs/DB';
import { usersSchema } from '@/models/Schema';

// Get all users
const users = await db.select().from(usersSchema);

// Get specific user by ID
const user = await db
  .select()
  .from(usersSchema)
  .where(eq(usersSchema.id, userId))
  .limit(1);
```

**With Filters**:
```typescript
import { eq, and, or } from 'drizzle-orm';

// Get therapists only
const therapists = await db
  .select()
  .from(usersSchema)
  .where(eq(usersSchema.role, 'therapist'));

// Complex conditions
const activeSessions = await db
  .select()
  .from(sessionsSchema)
  .where(
    and(
      eq(sessionsSchema.therapistId, therapistId),
      eq(sessionsSchema.transcriptionStatus, 'completed')
    )
  );
```

### 2. Inserting Data

**Insert Single Record**:
```typescript
import { db } from '@/libs/DB';
import { usersSchema, NewUser } from '@/models/Schema';

const newUser: NewUser = {
  email: 'therapist@example.com',
  name: 'Dr. Smith',
  role: 'therapist',
  firebaseUid: 'firebase_uid_123',
};

const [insertedUser] = await db
  .insert(usersSchema)
  .values(newUser)
  .returning();

console.log('Created user:', insertedUser.id);
```

**Insert Multiple Records**:
```typescript
const newSessions = [
  { title: 'Session 1', sessionDate: '2025-01-15', therapistId: '...' },
  { title: 'Session 2', sessionDate: '2025-01-16', therapistId: '...' },
];

await db.insert(sessionsSchema).values(newSessions);
```

### 3. Updating Data

**Update Single Record**:
```typescript
import { db } from '@/libs/DB';
import { sessionsSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

await db
  .update(sessionsSchema)
  .set({
    transcriptionStatus: 'completed',
    updatedAt: new Date(),
  })
  .where(eq(sessionsSchema.id, sessionId));
```

### 4. Deleting Data

**Delete with Condition**:
```typescript
import { db } from '@/libs/DB';
import { sessionsSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

await db
  .delete(sessionsSchema)
  .where(eq(sessionsSchema.id, sessionId));
```

**Cascade Deletes**: Many foreign keys have `onDelete: 'cascade'`, so related records auto-delete:
```typescript
// This schema definition:
groupId: uuid('group_id').references(() => groupsSchema.id, {
  onDelete: 'cascade',
})

// Means: deleting a group automatically deletes all group_members
await db.delete(groupsSchema).where(eq(groupsSchema.id, groupId));
// ✅ All related group_members are also deleted
```

### 5. Joins and Relations

**Inner Join**:
```typescript
import { db } from '@/libs/DB';
import { sessionsSchema, usersSchema } from '@/models/Schema';
import { eq } from 'drizzle-orm';

const sessionsWithTherapists = await db
  .select({
    session: sessionsSchema,
    therapist: usersSchema,
  })
  .from(sessionsSchema)
  .innerJoin(
    usersSchema,
    eq(sessionsSchema.therapistId, usersSchema.id)
  );
```

**Left Join**:
```typescript
const sessionsWithPatients = await db
  .select({
    session: sessionsSchema,
    patient: usersSchema,
  })
  .from(sessionsSchema)
  .leftJoin(
    usersSchema,
    eq(sessionsSchema.patientId, usersSchema.id)
  );
```

### 6. Transactions

**Safe Multi-Step Operations**:
```typescript
import { db } from '@/libs/DB';
import { sessionsSchema, transcriptsSchema } from '@/models/Schema';

await db.transaction(async (tx) => {
  // Step 1: Create session
  const [session] = await tx
    .insert(sessionsSchema)
    .values({ title: 'Session 1', ... })
    .returning();

  // Step 2: Create transcript
  await tx
    .insert(transcriptsSchema)
    .values({ sessionId: session.id, fullText: '...' });

  // If any step fails, everything rolls back
});
```

---

## Production Setup

### Step 1: Create Neon Database

See [SETUP_GUIDE.md#2-database-setup-neon-postgresql](./SETUP_GUIDE.md#2-database-setup-neon-postgresql) for detailed Neon setup.

**Quick Steps**:
1. Go to [Neon Console](https://console.neon.tech/)
2. Create project: `storycare-prod`
3. Copy connection string (pooled)
4. Add to Vercel environment variables

### Step 2: Set Production DATABASE_URL

**In Vercel**:
```bash
DATABASE_URL=postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/storycare?sslmode=require
```

### Step 3: Run Migrations on Production

Migrations auto-run during Vercel build:
```bash
# In package.json
"build": "run-s db:migrate build:next"
```

This ensures migrations apply before deploying new code.

### Step 4: Verify

After deployment:
```bash
# Check migrations in Neon dashboard
# Or use Drizzle Studio with production credentials (carefully!)
```

---

## Schema Updates Workflow

### Example: Adding a "Prompts Library" Feature

#### Step 1: Update Schema

Edit `src/models/Schema.ts`:
```typescript
// Add new table
export const promptsSchema = pgTable('prompts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 100 }),
  therapistId: uuid('therapist_id')
    .references(() => usersSchema.id)
    .notNull(),
  isPublic: boolean('is_public').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Add types
export type Prompt = typeof promptsSchema.$inferSelect;
export type NewPrompt = typeof promptsSchema.$inferInsert;
```

#### Step 2: Generate Migration

```bash
npm run db:generate
```

Creates: `migrations/0002_add_prompts_table.sql`

#### Step 3: Review Migration SQL

Open the generated file:
```sql
-- migrations/0002_add_prompts_table.sql
CREATE TABLE IF NOT EXISTS "prompts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title" varchar(255) NOT NULL,
  "content" text NOT NULL,
  "category" varchar(100),
  "therapist_id" uuid NOT NULL,
  "is_public" boolean DEFAULT false,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "prompts" ADD CONSTRAINT "prompts_therapist_id_fkey"
FOREIGN KEY ("therapist_id") REFERENCES "users"("id");
```

#### Step 4: Apply Migration

```bash
npm run db:migrate
```

✅ New table is now in your database!

#### Step 5: Use in Code

```typescript
// src/app/api/prompts/route.ts
import { db } from '@/libs/DB';
import { promptsSchema } from '@/models/Schema';

export async function GET() {
  const prompts = await db
    .select()
    .from(promptsSchema)
    .where(eq(promptsSchema.isPublic, true));

  return Response.json(prompts);
}
```

---

## Troubleshooting

### Issue: Migration Fails

**Error**: `relation "users" already exists`

**Cause**: Migration already applied or duplicate

**Solution**:
```bash
# Check migration journal
npm run db:studio
# Look at __drizzle_migrations table

# Or manually check
psql $DATABASE_URL -c "SELECT * FROM __drizzle_migrations;"

# If needed, drop and recreate (DEV ONLY!)
npm run db:migrate
```

### Issue: Type Errors After Schema Change

**Error**: `Type 'X' is not assignable to type 'Y'`

**Cause**: TypeScript types out of sync with schema

**Solution**:
```bash
# Restart TypeScript server in VS Code
# Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Or restart dev server
npm run dev:simple
```

### Issue: Cannot Connect to Database

**Error**: `Connection refused` or `Timeout`

**Solution** (Local):
```bash
# Check DATABASE_URL in .env.local
echo $DATABASE_URL

# PGlite should auto-start with dev server
npm run dev:simple
```

**Solution** (Production):
```bash
# Verify Neon connection string
# Check Neon dashboard for database status
# Ensure ?sslmode=require is in URL
```

### Issue: Schema Drift (Local vs Production)

**Problem**: Local database doesn't match production

**Solution**:
```bash
# 1. Reset local database
rm -rf local.db

# 2. Re-run migrations
npm run db:migrate

# 3. Seed with test data if needed
```

### Issue: Migration Order Problems

**Problem**: Migrations applied out of order

**Solution**:
```bash
# Drizzle tracks order automatically via journal
# If corrupted, manual fix needed:

# 1. Check journal
npm run db:studio
# View __drizzle_migrations table

# 2. Remove bad entries
# 3. Re-run migrations
npm run db:migrate
```

---

## Best Practices

### 1. Always Generate Migrations
❌ **Don't** manually write SQL files
✅ **Do** use `npm run db:generate`

### 2. Review Before Applying
```bash
# After generating, review the SQL
cat migrations/0XXX_your_migration.sql

# Then apply
npm run db:migrate
```

### 3. Use Transactions for Complex Operations
```typescript
// ✅ Good: Atomic operation
await db.transaction(async (tx) => {
  await tx.insert(usersSchema).values(...);
  await tx.insert(sessionsSchema).values(...);
});

// ❌ Bad: Can leave partial data
await db.insert(usersSchema).values(...);
await db.insert(sessionsSchema).values(...);
```

### 4. Type Safety
```typescript
// ✅ Good: Use inferred types
import { User, NewUser } from '@/models/Schema';

const user: User = await db.select()...;
const newUser: NewUser = { email: '...', ... };

// ❌ Bad: Manual types
const user: { id: string; email: string; ... } = ...;
```

### 5. Indexes for Performance
```typescript
// Add indexes for frequently queried fields
export const sessionsSchema = pgTable('sessions', {
  // ... fields
}, (table) => ({
  therapistIdIdx: index('sessions_therapist_id_idx').on(table.therapistId),
  sessionDateIdx: index('sessions_date_idx').on(table.sessionDate),
}));
```

---

## Quick Reference

```bash
# Generate migration from schema changes
npm run db:generate

# Apply pending migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio

# Run dev server (auto-starts PGlite)
npm run dev:simple

# Build for production (includes migrations)
npm run build
```

---

## Schema Diagram

```
users (therapists, patients, admins)
  ├── sessions (therapy sessions)
  │   ├── transcripts (full text)
  │   │   ├── speakers (identified speakers)
  │   │   │   └── utterances (individual words/phrases)
  │   │   └── quotes (highlighted quotes)
  │   └── media_library (images, videos)
  │
  ├── groups (therapy groups)
  │   └── group_members
  │
  ├── scenes (video compilations)
  │   └── scene_clips (media clips in scenes)
  │
  ├── story_pages (patient-facing pages)
  │   ├── page_blocks (video, image, text, etc.)
  │   │   ├── reflection_questions
  │   │   └── survey_questions
  │   ├── reflection_responses
  │   ├── survey_responses
  │   └── patient_page_interactions (engagement tracking)
  │
  └── notes (therapist notes)
```

---

**Last Updated**: 2025-10-30
**Maintained By**: Development Team

<function_calls>
<invoke name="Read">
<parameter name="file_path">/mnt/c/Users/user/code/walturn/Next-js-Boilerplate/drizzle.config.ts