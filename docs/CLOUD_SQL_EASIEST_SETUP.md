# Cloud SQL - Easiest Setup Ever (3 Steps)

The simplest way to connect to your Cloud SQL instance **right now**.

## Your Instance
- **Connection Name**: `storycare-478114:us-central1:storycare-dev`
- **Public IP**: `34.9.78.204`

---

## 🚀 Method 1: Quick & Dirty (2 Minutes)

### Step 1: Whitelist Your IP

```bash
# Get your IP
curl ifconfig.me

# Add it to Cloud SQL
gcloud sql instances patch storycare-dev \
  --authorized-networks=$(curl -s ifconfig.me)/32
```

### Step 2: Create User & Database

```bash
# Create user
gcloud sql users create admin \
  --instance=storycare-dev \
  --password=admin123

# Create database
gcloud sql databases create storycare_dev \
  --instance=storycare-dev
```

### Step 3: Update .env.local

```bash
DATABASE_URL="postgresql://admin:admin123@34.9.78.204:5432/storycare_dev?sslmode=require"
```

### Test It

```bash
npm run db:push
```

**Done!** ✅

---

## 🔒 Method 2: Secure Way (5 Minutes)

If the above doesn't work or you want better security:

### Step 1: Install Cloud SQL Proxy

```bash
# macOS
brew install cloud-sql-proxy
```

### Step 2: Authenticate

```bash
gcloud auth application-default login
```

### Step 3: Start Proxy (Terminal 1)

```bash
cloud-sql-proxy storycare-478114:us-central1:storycare-dev
```

Leave this running!

### Step 4: Create User & Database (Terminal 2)

```bash
# Create user
gcloud sql users create admin \
  --instance=storycare-dev \
  --password=admin123

# Create database
gcloud sql databases create storycare_dev \
  --instance=storycare-dev
```

### Step 5: Update .env.local

```bash
DATABASE_URL="postgresql://admin:admin123@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

### Step 6: Test It

```bash
# In Terminal 2
npm run db:push
```

**Done!** ✅

---

## 🆘 Still Not Working?

### Check if user exists:

```bash
gcloud sql users list --instance=storycare-dev
```

### Check if database exists:

```bash
gcloud sql databases list --instance=storycare-dev
```

### Reset everything:

```bash
# Delete user
gcloud sql users delete admin --instance=storycare-dev

# Delete database
gcloud sql databases delete storycare_dev --instance=storycare-dev

# Start over from Step 2
```

---

## 📋 Quick Reference

### Your Connection Details

**Method 1 (Direct):**
```
Host: 34.9.78.204
Port: 5432
User: admin
Password: admin123
Database: storycare_dev
SSL: require
```

**Method 2 (Proxy):**
```
Host: 127.0.0.1
Port: 5432
User: admin
Password: admin123
Database: storycare_dev
SSL: disable
```

### Connection Strings

**Direct:**
```bash
postgresql://admin:admin123@34.9.78.204:5432/storycare_dev?sslmode=require
```

**Proxy:**
```bash
postgresql://admin:admin123@127.0.0.1:5432/storycare_dev?sslmode=disable
```

---

## 🎯 Recommendation

- **For quick testing**: Use Method 1 (Direct)
- **For daily development**: Use Method 2 (Proxy)

Method 2 is more secure and won't break if your IP changes.

---

## ✅ Verification

Once connected, verify it works:

```bash
# Connect with psql
psql "postgresql://admin:admin123@127.0.0.1:5432/storycare_dev"

# Or test with Drizzle
npm run db:push

# Or check connection in Node.js
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('❌ Error:', err.message);
  else console.log('✅ Connected! Server time:', res.rows[0].now);
  pool.end();
});
"
```

---

**Created**: 2025-11-27
**Instance**: storycare-478114:us-central1:storycare-dev
