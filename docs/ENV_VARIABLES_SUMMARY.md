# Environment Variables Summary

## What's in ENV_FILE_DEV (GitHub Secret)

This single secret contains ALL environment variables needed for the Docker build:

### Firebase (Client + Admin)
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_CLIENT_EMAIL
FIREBASE_ADMIN_PRIVATE_KEY (multi-line)
```

### Database
```
DATABASE_URL (Cloud Run unix socket format)
```

### Google Cloud Storage
```
GCS_PROJECT_ID
GCS_CLIENT_EMAIL
GCS_PRIVATE_KEY (multi-line)
GCS_BUCKET_NAME
```

### AI Services
```
DEEPGRAM_API_KEY
OPENAI_API_KEY
GOOGLE_VERTEX_PROJECT_ID
GOOGLE_VERTEX_LOCATION
GOOGLE_SERVICE_ACCOUNT_KEY (JSON string with \n in private key)
STABILITY_API_KEY
FAL_API_KEY
VERTEX_API_KEY
ATLASCLOUD_API_KEY
SUNO_API_KEY
```

### Security & Monitoring
```
ARCJET_KEY
NEXT_TELEMETRY_DISABLED
NEXT_PUBLIC_SENTRY_DSN (empty for dev)
NEXT_PUBLIC_POSTHOG_KEY (empty for dev)
NEXT_PUBLIC_POSTHOG_HOST
NEXT_PUBLIC_BETTER_STACK_SOURCE_TOKEN (empty for dev)
```

## What's in GCP Secret Manager

These are loaded at RUNTIME in Cloud Run (NOT during build):

1. **DATABASE_URL_DEV** - For dev Cloud Run instance
2. **DATABASE_URL** - For prod Cloud Run instance

## Key Points

✅ **ENV_FILE approach**: All variables in one GitHub secret, easy to manage
✅ **Build-time**: Used during Docker build with `--build-arg ENV_FILE`
✅ **Runtime**: Only DATABASE_URL loaded from GCP Secret Manager
✅ **No comments**: The .env.github.dev file has NO inline comments (would break shell)
✅ **Multi-line keys**: Private keys are properly formatted with line breaks

## Differences from .env.local

### Local (.env.local):
- `DATABASE_URL` uses `127.0.0.1:5432` (Cloud SQL Proxy)

### Cloud Run (ENV_FILE_DEV):
- `DATABASE_URL` uses unix socket `/cloudsql/storycare-478114:us-central1:storycare-dev`

## Production Setup (ENV_FILE_PROD)

For production, create a similar file with:
- Same API keys (unless you have separate prod keys)
- Different DATABASE_URL pointing to prod Cloud SQL instance
- Production Firebase project (if separate from dev)
- Filled monitoring variables (Sentry, PostHog, Better Stack)
