# DATABASE_URL Configuration Guide

## 📋 Your Cloud SQL Database Info

- **Instance Connection Name**: `storycare-478114:us-central1:storycare-dev`
- **Database Name**: `storycare_dev`
- **Username**: `postgres`
- **Password**: `I|0PRO]3ya4NC_BY`
- **Public IP**: `34.9.78.204` (for direct connection)

---

## 🔑 DATABASE_URL Formats

### 1. Local Development (with Cloud SQL Proxy)

**Use this in `.env.local`:**

```bash
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

**How it works:**
- Cloud SQL Proxy runs on your machine
- Proxy listens on `127.0.0.1:5432`
- Your app connects to localhost
- Proxy forwards connection to Cloud SQL securely
- SSL is disabled (proxy handles encryption)

**Terminal 1 (keep running):**
```bash
cloud-sql-proxy storycare-478114:us-central1:storycare-dev
```

**Terminal 2:**
```bash
npm run dev
```

---

### 2. Cloud Run (Production/Dev)

**Use this in GCP Secret Manager:**

```bash
postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev
```

**How it works:**
- Cloud Run connects via Unix socket (not TCP)
- No IP address needed (that's why there's nothing after `@`)
- `host=/cloudsql/...` tells it to use the socket
- Cloud Run automatically mounts the socket when you use `--add-cloudsql-instances`

---

### 3. Direct Connection (NOT RECOMMENDED)

**Only use for testing:**

```bash
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@34.9.78.204:5432/storycare_dev?sslmode=require"
```

**Why not recommended:**
- ⚠️ Requires whitelisting your IP
- ⚠️ Less secure (direct TCP connection)
- ⚠️ Your IP changes = connection breaks
- ✅ Use Cloud SQL Proxy instead!

---

## 📝 Setup Instructions

### Step 1: Update Your `.env.local`

```bash
# Replace the entire DATABASE_URL line with:
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

### Step 2: Create GCP Secrets for Cloud Run

**For Dev environment:**

```bash
echo -n "postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | \
  gcloud secrets create DATABASE_URL_DEV \
  --data-file=- \
  --project=storycare-478114
```

**For Prod environment (if you have a separate prod database later):**

```bash
echo -n "postgresql://postgres:PROD_PASSWORD@/storycare_prod?host=/cloudsql/storycare-478114:us-central1:storycare-prod" | \
  gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=storycare-478114
```

**For now, use the same dev database for prod:**

```bash
echo -n "postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | \
  gcloud secrets create DATABASE_URL \
  --data-file=- \
  --project=storycare-478114
```

---

## 🔍 Understanding the Format

### Local (Proxy) Format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=disable
           ↓       ↓       ↓     ↓      ↓
         postgres  I|0... 127.0.0.1 5432 storycare_dev
```

### Cloud Run Format:
```
postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/INSTANCE_CONNECTION_NAME
           ↓       ↓       ↓      ↓                    ↓
         postgres  I|0...  (empty) storycare_dev      storycare-478114:us-central1:storycare-dev
```

**Key difference:**
- Local uses **TCP** (IP:Port)
- Cloud Run uses **Unix socket** (no IP, uses host parameter)

---

## ✅ Quick Test

### Test Local Connection:

```bash
# Terminal 1: Start proxy
cloud-sql-proxy storycare-478114:us-central1:storycare-dev

# Terminal 2: Test connection
psql "postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"

# Or test with Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable'
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Error:', err.message);
  else console.log('✅ Connected! Server time:', res.rows[0].now);
  pool.end();
});
"
```

---

## 📊 Environment Summary

| Environment | DATABASE_URL Format | Where to Store |
|------------|---------------------|----------------|
| **Local Dev** | `postgresql://postgres:PASSWORD@127.0.0.1:5432/storycare_dev?sslmode=disable` | `.env.local` |
| **Cloud Run Dev** | `postgresql://postgres:PASSWORD@/storycare_dev?host=/cloudsql/INSTANCE` | GCP Secret: `DATABASE_URL_DEV` |
| **Cloud Run Prod** | `postgresql://postgres:PASSWORD@/storycare_prod?host=/cloudsql/INSTANCE` | GCP Secret: `DATABASE_URL` |

---

## 🚨 Common Issues

### Error: "database does not exist"
```bash
# Create the database
gcloud sql databases create storycare_dev \
  --instance=storycare-dev \
  --project=storycare-478114
```

### Error: "password authentication failed"
```bash
# Reset the password
gcloud sql users set-password postgres \
  --instance=storycare-dev \
  --password='I|0PRO]3ya4NC_BY' \
  --project=storycare-478114
```

### Error: "connection refused"
```bash
# Make sure Cloud SQL Proxy is running
cloud-sql-proxy storycare-478114:us-central1:storycare-dev
```

### Error: "SSL connection required"
```bash
# Add sslmode parameter
DATABASE_URL="...?sslmode=disable"  # For proxy
DATABASE_URL="...?sslmode=require"  # For direct connection
```

---

## 🔐 Security Best Practices

1. ✅ **Never commit** `.env.local` to git (already in `.gitignore`)
2. ✅ **Use Cloud SQL Proxy** for local development (more secure than direct connection)
3. ✅ **Use GCP Secret Manager** for Cloud Run (secrets not in code)
4. ✅ **Use different passwords** for dev and prod
5. ✅ **Rotate passwords** regularly

---

## 📝 Quick Copy-Paste

**For `.env.local`:**
```bash
DATABASE_URL="postgresql://postgres:I|0PRO]3ya4NC_BY@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

**Create Dev Secret:**
```bash
echo -n "postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | gcloud secrets create DATABASE_URL_DEV --data-file=- --project=storycare-478114
```

**Create Prod Secret (same DB for now):**
```bash
echo -n "postgresql://postgres:I|0PRO]3ya4NC_BY@/storycare_dev?host=/cloudsql/storycare-478114:us-central1:storycare-dev" | gcloud secrets create DATABASE_URL --data-file=- --project=storycare-478114
```

---

**Last Updated:** 2025-11-27
**Instance:** storycare-478114:us-central1:storycare-dev
**Database:** storycare_dev
