# Enable Public Access to Cloud Run Service

## Problem
Your Cloud Run service is deployed but requires authentication because of an organization policy that restricts who can access your services.

**Error Message:**
```
ERROR: (gcloud.run.services.add-iam-policy-binding) FAILED_PRECONDITION:
One or more users named in the policy do not belong to a permitted customer,
perhaps due to an organization policy.
```

## Current Status
✅ Service is deployed: `https://storycare-app-dev-sbfj3zrjva-uc.a.run.app`
❌ Public access is blocked by organization policy
⚠️ Service requires authentication to access

## Solution Options

### Option 1: Ask Organization Admin to Update Policy (Recommended)

If your project is part of an organization, you need an **Organization Admin** to allow public access.

#### Step 1: Identify Who Can Help
Organization admins typically include:
- Your IT department
- DevOps team lead
- Google Cloud organization administrator
- Someone with `Organization Policy Administrator` role

#### Step 2: Send Them This Request

**Email Template:**

```
Subject: Request to Enable Public Access for Cloud Run Services

Hi [Admin Name],

I need to enable public access for our Cloud Run service in the project
"storycare-478114". Currently, the organization policy
"iam.allowedPolicyMemberDomains" is blocking public access (allUsers).

Could you please update the organization policy to allow public access?

Here are two options:

Option A: Allow public access for entire organization
Option B: Allow public access for just our project (storycare-478114)

Commands are provided below. Please let me know if you need any additional
information.

Thanks!
```

#### Step 3: Commands for Organization Admin

**Option A: Allow Public Access Organization-Wide**

```bash
# Create policy file
cat > /tmp/allow-public-access.yaml << 'EOF'
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allValues: ALLOW
EOF

# Apply to organization (replace ORG_ID with your organization ID)
gcloud resource-manager org-policies set-policy /tmp/allow-public-access.yaml \
  --organization=ORG_ID
```

**Option B: Allow Public Access for Single Project (More Secure)**

```bash
# Create policy file
cat > /tmp/allow-public-access-project.yaml << 'EOF'
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allValues: ALLOW
EOF

# Apply to specific project
gcloud resource-manager org-policies set-policy /tmp/allow-public-access-project.yaml \
  --project=storycare-478114
```

**Option C: Allow Only Specific Domains + Public Access**

```bash
# Create policy file that allows specific domain + public
cat > /tmp/allow-domain-and-public.yaml << 'EOF'
constraint: constraints/iam.allowedPolicyMemberDomains
listPolicy:
  allowedValues:
    - "allUsers"
    - "allAuthenticatedUsers"
    - "entryway.health"  # Your organization domain
EOF

# Apply to project
gcloud resource-manager org-policies set-policy /tmp/allow-domain-and-public.yaml \
  --project=storycare-478114
```

#### Step 4: After Admin Updates Policy

Once the admin updates the policy, run this command to enable public access:

```bash
gcloud run services add-iam-policy-binding storycare-app-dev \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=storycare-478114
```

Or re-run your GitHub Actions deployment - the `--allow-unauthenticated` flag will automatically apply.

---

### Option 2: Use Authenticated Access Only

If public access is not allowed by your organization's security policy, you can keep the service authenticated and access it with tokens.

#### For Development/Testing:

```bash
# Generate auth token and make request
curl -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  https://storycare-app-dev-sbfj3zrjva-uc.a.run.app/api/health
```

#### For Production Application:

1. Create a service account for your frontend/client application:
```bash
gcloud iam service-accounts create storycare-frontend \
  --display-name="StoryCare Frontend App" \
  --project=storycare-478114
```

2. Grant it Cloud Run Invoker role:
```bash
gcloud run services add-iam-policy-binding storycare-app-dev \
  --region=us-central1 \
  --member="serviceAccount:storycare-frontend@storycare-478114.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --project=storycare-478114
```

3. Your frontend app uses this service account to get tokens:
```javascript
// Example: Node.js backend
const { GoogleAuth } = require('google-auth-library');

const auth = new GoogleAuth();
const client = await auth.getIdTokenClient(
  'https://storycare-app-dev-sbfj3zrjva-uc.a.run.app'
);

const response = await client.request({
  url: 'https://storycare-app-dev-sbfj3zrjva-uc.a.run.app/api/health'
});
```

---

### Option 3: Use Load Balancer with IAP (Advanced)

For enterprise security, use Identity-Aware Proxy:

1. Set up Cloud Load Balancer
2. Configure Identity-Aware Proxy (IAP)
3. Control access via Google accounts/groups
4. Keep Cloud Run service private

This is more complex but provides better security and access control.

---

## How to Check Current Organization Policy

```bash
# Check current policy
gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains \
  --project=storycare-478114

# Check who has permission to modify it
gcloud projects get-iam-policy storycare-478114 \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/orgpolicy.policyAdmin"
```

---

## Quick Reference

### Current Service Details
- **Service Name:** `storycare-app-dev`
- **Region:** `us-central1`
- **Project ID:** `storycare-478114`
- **Project Number:** `832961952490`
- **URL:** `https://storycare-app-dev-sbfj3zrjva-uc.a.run.app`

### Service Accounts
- **GitHub Actions SA:** `github-actions@storycare-478114.iam.gserviceaccount.com`
- **Default Compute SA:** `832961952490-compute@developer.gserviceaccount.com`

### Secrets with Access Granted
- ✅ `DATABASE_URL_DEV` - Both SAs have access
- ✅ `DATABASE_URL` - Both SAs have access

---

## Testing After Enabling Public Access

Once public access is enabled, test it:

```bash
# Should return 200 OK without authentication
curl -i https://storycare-app-dev-sbfj3zrjva-uc.a.run.app/api/health

# Open in browser (should work without login)
open https://storycare-app-dev-sbfj3zrjva-uc.a.run.app
```

---

## Troubleshooting

### "Permission denied" errors
- Check that organization policy is updated: `gcloud resource-manager org-policies describe iam.allowedPolicyMemberDomains --project=storycare-478114`
- Verify you're using the correct project: `gcloud config get-value project`

### "Service not found" errors
- Check service exists: `gcloud run services list --project=storycare-478114`
- Verify region: `--region=us-central1`

### "Unauthenticated" errors when accessing
- Check IAM policy: `gcloud run services get-iam-policy storycare-app-dev --region=us-central1 --project=storycare-478114`
- Should see `allUsers` with `roles/run.invoker` role

---

## Next Steps After Public Access is Enabled

1. ✅ Verify deployment works: Check GitHub Actions workflow
2. ✅ Test health endpoint: `curl https://storycare-app-dev-sbfj3zrjva-uc.a.run.app/api/health`
3. ✅ Test application functionality
4. 📝 Apply same configuration to production workflow
5. 📝 Set up monitoring and alerts
6. 📝 Configure custom domain (optional)

---

## Contact

If you need help:
1. Check GitHub Actions logs: https://github.com/akbar904/story-care/actions
2. Check Cloud Run logs: https://console.cloud.google.com/run/detail/us-central1/storycare-app-dev/logs
3. Contact your organization admin for policy changes
