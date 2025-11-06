# Quick Fix: Grant Vertex AI Permissions

## ⚠️ Current Error
```
Permission 'aiplatform.endpoints.predict' denied on resource
```

This means your service account `vertex-express@nara-ai.iam.gserviceaccount.com` needs additional permissions.

## ⚡ Try These Roles (In Order)

### Option 1: Vertex AI User (Standard)
This should work for most Gemini models.

### Option 2: Vertex AI Administrator (If Option 1 doesn't work)
Some preview models require admin access.

## 🔧 Fix via Google Cloud Console (Recommended - 2 minutes)

### Step 1: Go to IAM Page
1. Visit: https://console.cloud.google.com/iam-admin/iam?project=nara-ai
2. Or: Google Cloud Console → IAM & Admin → IAM

### Step 2: Find Your Service Account
1. Look for: `vertex-express@nara-ai.iam.gserviceaccount.com`
2. Click the **pencil icon (✏️)** on the right to edit permissions

### Step 3: Add Roles (Add BOTH)
1. Click **"+ ADD ANOTHER ROLE"**
2. Search for: **"Vertex AI User"**
3. Select: **Vertex AI User** (`roles/aiplatform.user`)
4. Click **"+ ADD ANOTHER ROLE"** again
5. Search for: **"Vertex AI Administrator"**
6. Select: **Vertex AI Administrator** (`roles/aiplatform.admin`)
7. Click **"SAVE"**

**Why both roles?**
- `Vertex AI User` - For standard model access
- `Vertex AI Administrator` - Required for some Gemini 2.5 preview features

### Step 4: Enable Generative AI API
1. Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com?project=nara-ai
2. Click **"ENABLE"** if not already enabled
3. Also check: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=nara-ai

### ✅ Done!
The changes take effect immediately. Try generating an image again!

---

## 🔧 Alternative Fix via gcloud CLI (30 seconds)

If you have `gcloud` CLI installed:

```bash
# Grant Vertex AI User role
gcloud projects add-iam-policy-binding nara-ai \
  --member="serviceAccount:vertex-express@nara-ai.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

# Grant Vertex AI Administrator role (needed for Gemini 2.5 Flash Image)
gcloud projects add-iam-policy-binding nara-ai \
  --member="serviceAccount:vertex-express@nara-ai.iam.gserviceaccount.com" \
  --role="roles/aiplatform.admin"

# Enable required APIs
gcloud services enable aiplatform.googleapis.com --project=nara-ai
gcloud services enable generativelanguage.googleapis.com --project=nara-ai
```

---

## 📋 Verify Permissions

After granting the role, verify it was applied:

1. Go to: https://console.cloud.google.com/iam-admin/iam?project=nara-ai
2. Find `vertex-express@nara-ai.iam.gserviceaccount.com`
3. You should see **"Vertex AI User"** in the roles column

---

## 🎯 What This Role Allows

The **Vertex AI User** role (`roles/aiplatform.user`) grants:
- ✅ `aiplatform.endpoints.predict` - Generate images/text with models
- ✅ `aiplatform.models.get` - Read model information
- ✅ Other read operations for Vertex AI resources

This is the **minimum permission** needed for image generation.

---

## 🔒 Security Note

If you need more restrictive permissions (production best practice), you can create a **custom role** with only:
- `aiplatform.endpoints.predict`
- `aiplatform.models.get`

But for now, **Vertex AI User** is the easiest and safest option.

---

## 🐛 Still Not Working?

### Check 1: Vertex AI API Enabled?
Visit: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com?project=nara-ai

Click **"ENABLE"** if not already enabled.

### Check 2: Correct Project?
Make sure you're in the **nara-ai** project:
- Top-left of Google Cloud Console should show "nara-ai"

### Check 3: Wait a Minute
Sometimes IAM changes take 1-2 minutes to propagate. Wait and try again.

### Check 4: Restart Dev Server
After granting permissions:
```bash
# Stop your dev server (Ctrl+C)
npm run dev
```

---

## 📸 Visual Guide

### Where to Click:
1. **IAM Page** → Find service account row
2. **Pencil icon (✏️)** → Opens edit panel
3. **+ ADD ANOTHER ROLE** → Opens role selector
4. **Type "Vertex AI User"** → Select it
5. **SAVE** → Done!

---

**Next Step:** After granting the role, try generating an image again. It should work immediately!
