import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod';

export const Env = createEnv({
  server: {
    // Database
    DATABASE_URL: z.string().min(1),

    // Firebase Admin SDK (Server-side)
    FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    FIREBASE_CLIENT_EMAIL: z.string().email().optional(),
    FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),

    // Google Cloud Storage
    GCS_PROJECT_ID: z.string().min(1).optional(),
    GCS_CLIENT_EMAIL: z.string().email().optional(),
    GCS_PRIVATE_KEY: z.string().min(1).optional(),
    GCS_BUCKET_NAME: z.string().min(1).optional(),

    // AI Services
    DEEPGRAM_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    SUNO_API_KEY: z.string().optional(),
    SUNO_WEBHOOK_SECRET: z.string().optional(),

    // Email Service (Paubox)
    PAUBOX_API_KEY: z.string().min(1).optional(),
    PAUBOX_API_USERNAME: z.string().min(1).optional(),

    // Video Processing (Cloud Run)
    VIDEO_PROCESSOR_URL: z.string().url().optional(),
    WEBHOOK_SECRET: z.string().min(1).optional(),
    CLOUD_RUN_JOB_NAME: z.string().min(1).optional(),
    CLOUD_RUN_REGION: z.string().min(1).optional(),

    // Langfuse (AI Observability)
    LANGFUSE_PUBLIC_KEY: z.string().min(1).optional(),
    LANGFUSE_SECRET_KEY: z.string().min(1).optional(),
    LANGFUSE_BASE_URL: z.string().url().optional(),

    // Trial Patient API
    TRIAL_API_KEY: z.string().min(1).optional(),

    // Intercom (Identity Verification)
    INTERCOM_SECRET_KEY: z.string().min(1).optional(),

    // Slack Error Notifications
    SLACK_ERROR_WEBHOOK_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional(),

    // Firebase Client SDK (Public)
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

    // Analytics
    NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().optional(),

    // Intercom (Customer Support)
    NEXT_PUBLIC_INTERCOM_APP_ID: z.string().optional(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
  },
  // You need to destructure all the keys manually
  runtimeEnv: {
    // Database
    DATABASE_URL: process.env.DATABASE_URL,

    // Firebase Admin SDK
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,

    // Google Cloud Storage
    GCS_PROJECT_ID: process.env.GCS_PROJECT_ID,
    GCS_CLIENT_EMAIL: process.env.GCS_CLIENT_EMAIL,
    GCS_PRIVATE_KEY: process.env.GCS_PRIVATE_KEY,
    GCS_BUCKET_NAME: process.env.GCS_BUCKET_NAME,

    // AI Services
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUNO_API_KEY: process.env.SUNO_API_KEY,
    SUNO_WEBHOOK_SECRET: process.env.SUNO_WEBHOOK_SECRET,

    // Email Service (Paubox)
    PAUBOX_API_KEY: process.env.PAUBOX_API_KEY,
    PAUBOX_API_USERNAME: process.env.PAUBOX_API_USERNAME,

    // Video Processing (Cloud Run)
    VIDEO_PROCESSOR_URL: process.env.VIDEO_PROCESSOR_URL,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    CLOUD_RUN_JOB_NAME: process.env.CLOUD_RUN_JOB_NAME,
    CLOUD_RUN_REGION: process.env.CLOUD_RUN_REGION,

    // Langfuse (AI Observability)
    LANGFUSE_PUBLIC_KEY: process.env.LANGFUSE_PUBLIC_KEY,
    LANGFUSE_SECRET_KEY: process.env.LANGFUSE_SECRET_KEY,
    LANGFUSE_BASE_URL: process.env.LANGFUSE_BASE_URL,

    // Trial Patient API
    TRIAL_API_KEY: process.env.TRIAL_API_KEY,

    // Intercom (Identity Verification)
    INTERCOM_SECRET_KEY: process.env.INTERCOM_SECRET_KEY,

    // Slack Error Notifications
    SLACK_ERROR_WEBHOOK_URL: process.env.SLACK_ERROR_WEBHOOK_URL,

    // Client vars
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,

    // Firebase Client SDK
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,

    // Analytics
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,

    // Intercom (Customer Support)
    NEXT_PUBLIC_INTERCOM_APP_ID: process.env.NEXT_PUBLIC_INTERCOM_APP_ID,

    // Shared
    NODE_ENV: process.env.NODE_ENV,
  },
});
