# Cloud SQL Database Setup - StoryCare

Complete guide for connecting to your existing Cloud SQL PostgreSQL instance.

## 📋 Your Instance Details

```
Instance Name: storycare-dev
Connection Name: storycare-dev-479511:us-central1:storycare-dev
Public IP: 34.9.78.204
Region: us-central1-c
Database Version: PostgreSQL 17
Status: Highly Available (Regional)
```

## ⚠️ Why You Got the Timeout Error

The error `connect ETIMEDOUT 34.9.78.204:5432` happened because:
1. Your IP address is not authorized to connect to the Cloud SQL instance
2. Cloud SQL blocks all public connections by default for security

**Solution**: Use **Cloud SQL Auth Proxy** (recommended) or authorize your IP.

---

## 🚀 Quick Fix (5 minutes)

### Method 1: Cloud SQL Auth Proxy (RECOMMENDED)

This is the **secure** way to connect without whitelisting IPs.

#### Step 1: Install Cloud SQL Auth Proxy

```bash
# macOS
brew install cloud-sql-proxy

# Or download manually
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.14.1/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy
sudo mv cloud-sql-proxy /usr/local/bin/
```

#### Step 2: Authenticate with Google Cloud

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project storycare-dev-479511

# Generate application credentials
gcloud auth application-default login
```

#### Step 3: Start the Proxy

```bash
# Start Cloud SQL Auth Proxy (keep this running!)
cloud-sql-proxy storycare-dev-479511:us-central1:storycare-dev
```

You should see:
```
Listening on 127.0.0.1:5432
The proxy has started successfully and is ready for new connections!
```

**Keep this terminal open!** The proxy must run while you work.

---

## 🔐 Create Database User & Database

Before you can connect, you need a user and database.

### Step 4: Create Database User

```bash
# In a NEW terminal (keep proxy running in the first one)

# Create user
gcloud sql users create storycare_admin \
  --instance=storycare-dev \
  --password=YOUR_SECURE_PASSWORD

# Replace YOUR_SECURE_PASSWORD with a real password!
# Example: $(openssl rand -base64 16)
```

**💡 Generate a secure password:**
```bash
# Generate random password
openssl rand -base64 16

# Example output: XyZ9k3L2mN8pQ1vW
```

### Step 5: Create Database

```bash
# Option A: Using gcloud CLI
gcloud sql databases create storycare_dev --instance=storycare-dev

# Option B: Using psql (if proxy is running)
psql "host=127.0.0.1 port=5432 sslmode=disable user=postgres dbname=postgres" -c "CREATE DATABASE storycare_dev;"
```

---

## 🔌 Configure Connection String

### Step 6: Update .env.local

Create or update `.env.local`:

```bash
# Cloud SQL Connection (via Cloud SQL Auth Proxy)
DATABASE_URL="postgresql://storycare_admin:YOUR_PASSWORD@127.0.0.1:5432/storycare_dev?sslmode=disable"

# Replace:
# - YOUR_PASSWORD with the password you created in Step 4
# - storycare_dev with your database name
```

**Example:**
```bash
DATABASE_URL="postgresql://storycare_admin:XyZ9k3L2mN8pQ1vW@127.0.0.1:5432/storycare_dev?sslmode=disable"
```

---

## ✅ Test the Connection

### Step 7: Run Drizzle Commands

```bash
# Make sure Cloud SQL Auth Proxy is running!

# Test 1: Push schema to database
npm run db:push

# Test 2: Generate migration
npm run db:generate

# Test 3: Open Drizzle Studio
npm run db:studio
```

**If it works, you'll see:**
```
✔ Migrations applied successfully
✔ Database synced
```

---

## 🔄 Workflow: Starting Development

Every time you start development:

**Terminal 1:**
```bash
# Start Cloud SQL Auth Proxy
cloud-sql-proxy storycare-dev-479511:us-central1:storycare-dev
```

**Terminal 2:**
```bash
# Start your app
npm run dev
```

---

## 🤖 Automate the Proxy (Optional)

### Create a Helper Script

Create `scripts/start-db-proxy.sh`:

```bash
#!/bin/bash

# Check if proxy is already running
if pgrep -x "cloud-sql-proxy" > /dev/null; then
    echo "✓ Cloud SQL Proxy is already running"
    exit 0
fi

echo "Starting Cloud SQL Proxy..."
cloud-sql-proxy storycare-dev-479511:us-central1:storycare-dev \
  --port 5432 \
  > /tmp/cloud-sql-proxy.log 2>&1 &

sleep 2

if pgrep -x "cloud-sql-proxy" > /dev/null; then
    echo "✓ Cloud SQL Proxy started successfully"
else
    echo "✗ Failed to start Cloud SQL Proxy"
    cat /tmp/cloud-sql-proxy.log
    exit 1
fi
```

Make it executable:
```bash
chmod +x scripts/start-db-proxy.sh
```

### Update package.json

```json
{
  "scripts": {
    "db:proxy": "sh scripts/start-db-proxy.sh",
    "db:proxy:stop": "pkill -x cloud-sql-proxy",
    "db:proxy:logs": "tail -f /tmp/cloud-sql-proxy.log",
    "dev": "npm run db:proxy && next dev"
  }
}
```

Now just run:
```bash
npm run dev  # Automatically starts proxy + dev server
```

---

## 🌐 Alternative Method 2: Authorize Your IP (Not Recommended)

> **Note:** As of mid-2024, some tiers like `db-g1-small` are no longer supported for Cloud SQL PostgreSQL, especially if your project/region defaults to ENTERPRISE_PLUS edition.
> You must use a supported tier such as `db-perf-optimized-N-RO`/`db-perf-optimized-N-RAM` (where N is vCPU count), or a `db-custom-*` tier.  
> See official docs: https://cloud.google.com/sql/docs/postgres/create-instance#machine-types

```bash
# Create PostgreSQL instance (dev/testing)
gcloud sql instances create storycare-db \
  --database-version=POSTGRES_16 \
  --tier=db-custom-2-7680 \
  --region=us-central1 \
  --network=default \
  --no-assign-ip \
  --enable-google-private-path \
  --root-password='REPLACE_WITH_SECURE_PASSWORD'

# Cheapest Option: Use Shared-Core Tier (suitable for dev/testing only; not recommended for production workloads)
# (1 vCPU, ~0.6 GB RAM, minimal cost - ~$7/month)
gcloud sql instances create storycare-db \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --network=default \
  --no-assign-ip \
  --enable-google-private-path \
  --root-password='bK6cxjSKhB'

# For production, consider:
# --tier=db-custom-2-7680   (2 vCPU, 7.5 GB RAM, ~$100/month, cheapest production tier)
#    # As of 2024: approximately $100/month for instance only (+$0.17/GB/month storage, backups extra)
# --availability-type=REGIONAL        (high availability, doubles compute cost)
# --backup-start-time=03:00           (daily backups at 3 AM)
```

**Tip:** Always use a **secure password**, not the example above.

**Tier Options:**
- `db-f1-micro` - 0.6 GB RAM (dev/testing) - ~$7/month
- `db-g1-small` - 1.7 GB RAM (small production) - ~$25/month
- `db-custom-2-7680` - 2 vCPU, 7.5 GB RAM (recommended, cheapest production tier) - ~$100/month
- `db-custom-4-15360` - 4 vCPU, 15 GB RAM (high traffic) - ~$200/month

### Step 3: Create Database

```bash
# Create the database
gcloud sql databases create storycare \
  --instance=storycare-db

# Create user (not root)
gcloud sql users create storycare_user \
  --instance=storycare-db \
  --password=aK6cxjSKhA

# List databases to verify
gcloud sql databases list --instance=storycare-db
```

### Step 4: Get Connection Details

```bash
# Get instance connection name (needed for connection string)
gcloud sql instances describe storycare-db \
  --format="value(connectionName)"

# Output: project-id:region:instance-name
# Example: storycare-prod-123:us-central1:storycare-db
```

Save this connection name - you'll need it!

---

## 🔌 Connection Options

### Option A: Cloud SQL Proxy (Recommended for Cloud Run)

Cloud SQL Proxy provides secure connections without managing SSL certificates.

#### Configure Cloud Run to use Cloud SQL Proxy

The deployment workflows already include Cloud SQL support. Just update the instance connection name:

**For GitHub Actions** (`.github/workflows/deploy-cloud-run.yml`):

```yaml
- name: Deploy to Cloud Run
  uses: google-github-actions/deploy-cloudrun@v2
  with:
    service: storycare-app
    region: us-central1
    image: gcr.io/${{ env.PROJECT_ID }}/storycare-app:${{ github.sha }}
    flags: |
      --add-cloudsql-instances=PROJECT_ID:REGION:INSTANCE_NAME
      # Example: --add-cloudsql-instances=storycare-prod-123:us-central1:storycare-db
```

**For Cloud Build** (`cloudbuild.yaml`):

```yaml
- '--add-cloudsql-instances'
- 'PROJECT_ID:REGION:INSTANCE_NAME'
```

#### Connection String Format

```bash
# Using Unix socket (Cloud Run with Cloud SQL Proxy)
DATABASE_URL="postgresql://storycare_user:password@/storycare?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME"

# Example:
DATABASE_URL="postgresql://storycare_user:SecurePass123@/storycare?host=/cloudsql/storycare-prod-123:us-central1:storycare-db"
```

### Option B: Public IP with SSL (Not Recommended)

```bash
# Assign public IP (if needed for local development)
gcloud sql instances patch storycare-db \
  --assign-ip

# Get public IP
gcloud sql instances describe storycare-db \
  --format="value(ipAddresses[0].ipAddress)"

# Connection string with public IP
DATABASE_URL="postgresql://storycare_user:password@PUBLIC_IP:5432/storycare?sslmode=require"
```

### Option C: Private IP (Most Secure)

For VPC-native Cloud Run:

```bash
# Already configured with --no-assign-ip flag in Step 2
# Cloud Run services in same VPC can connect via private IP

# Get private IP
gcloud sql instances describe storycare-db \
  --format="value(ipAddresses[1].ipAddress)"

# Connection string
DATABASE_URL="postgresql://storycare_user:password@PRIVATE_IP:5432/storycare"
```

---

## 🔐 Security Configuration

### Step 5: Configure Authorized Networks (if using public IP)

```bash
# Allow Cloud Run IP ranges (if using public IP - not recommended)
# Better to use Cloud SQL Proxy

# For local development only
gcloud sql instances patch storycare-db \
  --authorized-networks=YOUR_IP_ADDRESS/32

# Example:
gcloud sql instances patch storycare-db \
  --authorized-networks=203.0.113.42/32
```

### Step 6: Enable SSL

```bash
# Require SSL connections
gcloud sql instances patch storycare-db \
  --require-ssl

# Download SSL certificates (if using public IP)
gcloud sql ssl-certs create storycare-client \
  --instance=storycare-db

gcloud sql ssl-certs describe storycare-client \
  --instance=storycare-db \
  --format="get(cert)" > client-cert.pem
```

### Step 7: Set Up IAM Authentication (Optional - Most Secure)

```bash
# Enable IAM authentication
gcloud sql instances patch storycare-db \
  --database-flags=cloudsql.iam_authentication=on

# Create IAM user
gcloud sql users create cloud-run-sa@$PROJECT_ID.iam \
  --instance=storycare-db \
  --type=CLOUD_IAM_SERVICE_ACCOUNT

# Grant Cloud Run service account permission
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

---

## 📝 Environment Variables Setup

### Step 8: Create Connection String

**For Cloud Run (with Cloud SQL Proxy):**

```bash
# Format:
postgresql://USERNAME:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME

# Example:
DATABASE_URL="postgresql://storycare_user:SecurePass123@/storycare?host=/cloudsql/storycare-prod-123:us-central1:storycare-db"
```

### Step 9: Add to Secret Manager

```bash
# Create secret
echo -n "postgresql://storycare_user:SecurePass123@/storycare?host=/cloudsql/storycare-prod-123:us-central1:storycare-db" | \
  gcloud secrets create DATABASE_URL \
    --data-file=- \
    --replication-policy="automatic"

# Verify secret
gcloud secrets versions access latest --secret="DATABASE_URL"
```

### Step 10: Local Development

For local development, use Cloud SQL Proxy:

```bash
# Download Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.darwin.amd64

# Make executable
chmod +x cloud-sql-proxy

# Run proxy (in separate terminal)
./cloud-sql-proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME

# Example:
./cloud-sql-proxy --port 5432 storycare-prod-123:us-central1:storycare-db
```

Then in `.env.local`:
```bash
# Local connection via Cloud SQL Proxy
DATABASE_URL="postgresql://storycare_user:SecurePass123@127.0.0.1:5432/storycare"
```

---

## 🗄️ Database Migrations

### Step 11: Run Initial Migrations

```bash
# Ensure Cloud SQL Proxy is running (for local)
./cloud-sql-proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME &

# Run migrations
npm run db:migrate

# Expected output:
# Applying migrations...
# ✔ Migration 0001_create_users.sql applied
# ✔ Migration 0002_create_groups.sql applied
# ... (12 migrations total)
# ✔ All migrations applied successfully!
```

### Step 12: Verify Schema

```bash
# Connect to database
gcloud sql connect storycare-db --user=storycare_user --database=storycare

# Or use psql via Cloud SQL Proxy
psql "postgresql://storycare_user:password@127.0.0.1:5432/storycare"

# List tables
\dt

# Should see:
# - users
# - groups
# - sessions
# - transcripts
# - speakers
# - utterances
# - media_library
# - quotes
# - scenes
# - story_pages
# - page_blocks
# - reflection_questions
# - survey_questions
# - reflection_responses
# - survey_responses
# - patient_page_interactions
# - chat_messages
# - system_prompts

# Exit
\q
```

---

## 📊 Monitoring & Maintenance

### View Database Metrics

```bash
# Get instance details
gcloud sql instances describe storycare-db

# View operations history
gcloud sql operations list --instance=storycare-db

# View database size
gcloud sql instances describe storycare-db \
  --format="value(settings.dataDiskSizeGb)"
```

**Cloud Console:**
1. Go to https://console.cloud.google.com/sql
2. Click on `storycare-db`
3. View metrics:
   - CPU utilization
   - Memory usage
   - Storage used
   - Connections
   - Queries per second

### Database Logs

```bash
# View error logs
gcloud sql instances logs tail storycare-db \
  --log=postgres \
  --filter="severity>=ERROR"

# View slow queries
gcloud sql instances logs tail storycare-db \
  --log=postgres \
  --filter="duration > 1000"
```

---

## 🔄 Backups & Recovery

### Automatic Backups

```bash
# Enable automated backups (if not already enabled)
gcloud sql instances patch storycare-db \
  --backup-start-time=03:00 \
  --backup-location=us \
  --retained-backups-count=7

# List backups
gcloud sql backups list --instance=storycare-db

# View backup details
gcloud sql backups describe BACKUP_ID --instance=storycare-db
```

### Manual Backup

```bash
# Create on-demand backup
gcloud sql backups create \
  --instance=storycare-db \
  --description="Pre-deployment backup $(date +%Y-%m-%d)"
```

### Restore from Backup

```bash
# List available backups
gcloud sql backups list --instance=storycare-db

# Restore from backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=storycare-db \
  --backup-id=BACKUP_ID

# Or restore to new instance
gcloud sql backups restore BACKUP_ID \
  --backup-instance=storycare-db \
  --target-instance=storycare-db-restored
```

### Export Database

```bash
# Create Cloud Storage bucket for exports
gsutil mb gs://$PROJECT_ID-db-backups

# Export entire database
gcloud sql export sql storycare-db \
  gs://$PROJECT_ID-db-backups/export-$(date +%Y%m%d).sql \
  --database=storycare

# Export specific tables
gcloud sql export sql storycare-db \
  gs://$PROJECT_ID-db-backups/users-export.sql \
  --database=storycare \
  --table=users
```

### Import Database

```bash
# Import from Cloud Storage
gcloud sql import sql storycare-db \
  gs://$PROJECT_ID-db-backups/import.sql \
  --database=storycare
```

---

## 📈 Scaling & Performance

### Upgrade Instance

```bash
# Upgrade to larger tier
gcloud sql instances patch storycare-db \
  --tier=db-custom-4-15360

# Increase storage
gcloud sql instances patch storycare-db \
  --storage-size=100GB \
  --storage-auto-increase
```

### Enable High Availability

```bash
# Enable regional HA (automatic failover)
gcloud sql instances patch storycare-db \
  --availability-type=REGIONAL

# This creates a standby replica in a different zone
# Automatic failover in case of zone failure
# ~2x cost but 99.95% SLA
```

### Read Replicas (Optional)

```bash
# Create read replica for scaling reads
gcloud sql instances create storycare-db-replica \
  --master-instance-name=storycare-db \
  --tier=db-custom-2-7680 \
  --region=us-central1

# Use replica for read-only queries
# Read replica connection:
# postgresql://user:pass@/storycare?host=/cloudsql/project:region:storycare-db-replica
```

---

## 💰 Cost Optimization

### Estimated Monthly Costs

**Development (db-f1-micro):**
- Instance: ~$7/month
- Storage: $0.17/GB/month (10GB = $1.70)
- Network: Minimal within same region
- **Total:** ~$10/month

**Production (db-custom-2-7680):**
- Instance: ~$100/month
- Storage: $0.17/GB/month (50GB = $8.50)
- Backups: $0.08/GB/month (7 days)
- **Total:** ~$120/month

**High Availability (REGIONAL):**
- 2x instance cost
- **Total:** ~$240/month

### Cost Saving Tips

```bash
# Stop instance during development (not for production!)
gcloud sql instances patch storycare-db --activation-policy=NEVER

# Start instance
gcloud sql instances patch storycare-db --activation-policy=ALWAYS

# Enable storage auto-increase (prevents manual upgrades)
gcloud sql instances patch storycare-db --storage-auto-increase

# Schedule backups during off-peak (cheaper egress)
gcloud sql instances patch storycare-db --backup-start-time=03:00
```

---

## 🏥 HIPAA Compliance

### Step 13: Sign Business Associate Agreement

Cloud SQL can be HIPAA compliant:

1. **Contact Google Cloud Sales:**
   - https://cloud.google.com/contact
   - Request HIPAA BAA for Cloud SQL
   - Complete BAA signing process

2. **Enable Required Features:**
```bash
# Require SSL
gcloud sql instances patch storycare-db --require-ssl

# Enable audit logging
gcloud sql instances patch storycare-db \
  --database-flags=log_connections=on,log_disconnections=on,log_statement=all

# Set retention for audit logs
gcloud logging sinks create cloudsql-audit-sink \
  storage.googleapis.com/$PROJECT_ID-audit-logs \
  --log-filter='resource.type="cloudsql_database"'
```

### HIPAA Checklist

- [ ] BAA signed with Google Cloud
- [ ] SSL/TLS required for all connections
- [ ] Cloud SQL Proxy used (not public IP)
- [ ] Audit logging enabled
- [ ] Automated backups enabled (7-day retention minimum)
- [ ] Access restricted via IAM
- [ ] Database encryption at rest (automatic)
- [ ] Database encryption in transit (SSL)
- [ ] Regular security patches (automatic)
- [ ] Monitoring and alerting configured

---

## 🐛 Troubleshooting

### Connection Issues

**Error: "connection refused"**
```bash
# Check instance is running
gcloud sql instances describe storycare-db --format="value(state)"

# Should output: RUNNABLE

# If not, start it
gcloud sql instances patch storycare-db --activation-policy=ALWAYS
```

**Error: "SSL required"**
```bash
# Add sslmode to connection string
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

**Error: "too many connections"**
```bash
# Check current connections
gcloud sql instances describe storycare-db \
  --format="value(settings.maxConnections)"

# Increase max connections
gcloud sql instances patch storycare-db \
  --database-flags=max_connections=100
```

### Performance Issues

```bash
# View slow queries
gcloud sql instances logs tail storycare-db \
  --log=postgres \
  --filter="duration > 1000"

# Enable query insights
gcloud sql instances patch storycare-db \
  --insights-config-query-insights-enabled \
  --insights-config-query-string-length=1024 \
  --insights-config-record-application-tags=true
```

---

## 🔧 Advanced Configuration

### Connection Pooling

Update `src/utils/DBConnection.ts`:

```typescript
export const createDbConnection = () => {
  const pool = new Pool({
    connectionString: Env.DATABASE_URL,
    // Cloud SQL optimized settings
    max: Env.NODE_ENV === 'production' ? 10 : 1,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    // Cloud SQL keeps connections alive
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000,
  });

  return drizzle({ client: pool, schema });
};
```

### Database Flags

```bash
# Optimize for Cloud Run
gcloud sql instances patch storycare-db \
  --database-flags=\
shared_buffers=256MB,\
max_connections=100,\
effective_cache_size=1GB,\
maintenance_work_mem=64MB,\
checkpoint_completion_target=0.9,\
wal_buffers=16MB,\
default_statistics_target=100
```

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Cloud SQL instance created
- [ ] Database and user created
- [ ] Cloud SQL Proxy configured in Cloud Run
- [ ] Connection string added to Secret Manager
- [ ] All migrations applied successfully
- [ ] Automated backups enabled
- [ ] SSL/TLS required
- [ ] Audit logging enabled
- [ ] Monitoring configured
- [ ] High availability enabled (optional)
- [ ] HIPAA BAA signed
- [ ] Connection tested from Cloud Run
- [ ] Performance testing completed
- [ ] Backup restore tested

---

## 📚 Additional Resources

- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud SQL Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy)
- [Cloud SQL Best Practices](https://cloud.google.com/sql/docs/postgres/best-practices)
- [HIPAA Compliance](https://cloud.google.com/security/compliance/hipaa)
- [Cloud SQL Pricing](https://cloud.google.com/sql/pricing)

---

**Last Updated:** 2025-01-15
**Version:** 1.0.0
