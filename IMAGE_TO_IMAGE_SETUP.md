# Image-to-Image Generation Setup Guide

## Overview

This guide explains how to set up and use the **Gemini 2.5 Flash Image (Nano Banana)** model for image-to-image generation in StoryCare. This model transforms reference images (like patient photos) based on text prompts.

## 🎯 What You Can Do

- **Transform patient photos** into therapeutic imagery
- **Create consistent character representations** across multiple images
- **Generate scenes** that incorporate the patient's likeness
- **Reframe narratives** visually by transforming how the patient sees themselves

## 🔧 Setup Instructions

### Step 1: Enable Google Cloud APIs

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Enable the following APIs:
   - **Vertex AI API**
   - **Cloud Resource Manager API**

   You can enable them by visiting:
   ```
   https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
   https://console.cloud.google.com/apis/library/cloudresourcemanager.googleapis.com
   ```

### Step 2: Create a Service Account

1. Go to [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
2. Click **"Create Service Account"**
3. Fill in details:
   - **Name**: `storycare-image-gen` (or any name you prefer)
   - **Description**: `Service account for Gemini image generation`
4. Click **"Create and Continue"**
5. Grant these roles:
   - **Vertex AI User** (`roles/aiplatform.user`)
   - Or **Vertex AI Administrator** (`roles/aiplatform.admin`) for full access
6. Click **"Done"**

### Step 3: Create and Download Service Account Key

1. Find your newly created service account in the list
2. Click the **three dots menu** (⋮) on the right
3. Select **"Manage keys"**
4. Click **"Add Key"** → **"Create new key"**
5. Choose **JSON** format
6. Click **"Create"** - the JSON file will download automatically
7. **Keep this file secure!** It contains sensitive credentials

### Step 4: Configure Environment Variables

You have two options for authentication:

#### Option A: Using Service Account JSON (Recommended for Production)

Add to your `.env.local` file:

```bash
# Google Vertex AI Configuration
GOOGLE_VERTEX_PROJECT_ID=your-project-id
GOOGLE_VERTEX_LOCATION=us-central1

# Service Account Authentication (choose ONE of these methods)
# Method 1: Path to service account JSON file (Local development)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your-service-account-key.json

# Method 2: Inline JSON (Recommended for deployment platforms like Vercel)
# IMPORTANT: Wrap the entire JSON in single quotes, keep \n as-is (do NOT escape to \\n)
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/...","universe_domain":"googleapis.com"}'
```

**Important Notes:**
- Use **single quotes** around the JSON value (not double quotes)
- Keep newlines in the private key as `\n` (NOT `\\n`)
- Copy the entire content of your service account JSON file
- The JSON should be on a single line within the quotes

**Finding your Project ID:**
- It's in the JSON file under `"project_id"`
- Or visit: https://console.cloud.google.com/home/dashboard

**Location options:**
- `us-central1` (Iowa, USA) - Default, good for most US users
- `us-east1` (South Carolina, USA)
- `us-west1` (Oregon, USA)
- `europe-west4` (Netherlands)
- `asia-southeast1` (Singapore)
- See all: https://cloud.google.com/vertex-ai/docs/general/locations

#### Option B: Using gcloud CLI (For Local Development Only)

If you have the Google Cloud SDK installed:

```bash
# Login with your Google account
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID
```

Then in `.env.local`:
```bash
GOOGLE_VERTEX_PROJECT_ID=your-project-id
GOOGLE_VERTEX_LOCATION=us-central1
```

### Step 5: Restart Your Development Server

```bash
npm run dev
```

## 📖 How to Use

### Basic Usage

1. **Navigate to a session transcript**
2. **Select text** from the transcript that you want to visualize
3. **Click "Generate Image"** in the AI Assistant panel
4. In the modal:
   - The selected text will be pre-filled as the prompt
   - **Choose "Nano Banana (Gemini 2.5 Flash Image)"** from the model dropdown
   - **Upload a reference image** (patient photo, or any image you want to transform)
   - Modify the prompt to describe how you want to transform the image
5. Click **"Generate"**

### Reference Image Options

You have three ways to provide a reference image:

1. **Patient Reference Image** (from database)
   - Toggle "Use Reference" ON
   - The patient's stored reference image will be used automatically

2. **Upload a New Image**
   - Click the "Upload Image" area
   - Select a JPG, PNG, or other image file
   - The image will be converted to base64 automatically

3. **No Reference** (will fail with Gemini)
   - Gemini 2.5 Flash Image **requires** a reference image
   - For text-to-image without reference, use Stability AI or FAL.AI models instead

### Example Prompts

**Transform a self-portrait into a hero:**
```
Transform this person into a confident superhero standing on a mountain peak,
golden hour lighting, inspirational atmosphere, photorealistic style
```

**Create a peaceful scene:**
```
Transform this person into a serene meditation pose in a zen garden,
soft natural lighting, peaceful expression, professional photography
```

**Visualize overcoming challenges:**
```
Show this person climbing a challenging mountain trail with determination,
reaching towards the summit, dramatic lighting, empowering mood
```

## 🔒 Security & Privacy

### HIPAA Compliance

- **Service Account Keys**: Store securely, never commit to version control
- **Patient Images**: Stored as base64 during transmission, then saved to HIPAA-compliant Google Cloud Storage
- **API Logs**: Vertex AI logs may contain metadata (not images)
- **BAA Required**: Sign a Business Associate Agreement with Google Cloud for HIPAA compliance

### Best Practices

1. **Never commit** `.env.local` or service account JSON files to git
2. **Rotate keys** regularly (every 90 days recommended)
3. **Use separate service accounts** for dev/staging/production
4. **Enable audit logging** in Google Cloud Console
5. **Limit service account permissions** to only what's needed (Vertex AI User role)

## 💰 Pricing

**Gemini 2.5 Flash Image Pricing** (as of 2025):
- **Input**: $0.00015 per image (reference image)
- **Output**: $0.00060 per generated image
- **Approximate cost**: ~$0.00075 per image generation

**Cost Optimization Tips:**
- Use lower resolution reference images when possible (reduces processing time)
- Cache generated images in your database to avoid regeneration
- Use the default model (Flash) instead of Ultra for most use cases

**Budget Example:**
- 1,000 images/month = ~$0.75/month
- 10,000 images/month = ~$7.50/month
- 100,000 images/month = ~$75/month

Compare this to DALL-E 3: ~$0.04 per image (53x more expensive)

## 🐛 Troubleshooting

### Error: "GOOGLE_VERTEX_PROJECT_ID is not configured"

**Solution:** Add `GOOGLE_VERTEX_PROJECT_ID` to your `.env.local` file

### Error: "Failed to get Google Cloud access token"

**Possible causes:**
1. Service account key file not found
2. Invalid JSON in service account key
3. Service account doesn't have necessary permissions

**Solutions:**
- Check `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Verify service account has "Vertex AI User" role
- Re-download service account key if corrupted
- Try `gcloud auth application-default login` for local dev

### Error: "API keys are not supported by this API"

This means the code is trying to use a simple API key instead of OAuth2.

**Solution:** This is now fixed! Make sure you're using the updated `GeminiImage.ts` provider.

### Error: "Reference image is required"

**Solution:** Gemini 2.5 Flash Image is an **image-to-image** model, not text-to-image. You must provide a reference image. Use Stability AI or FAL.AI models if you want pure text-to-image.

### Error: "Permission denied" or "403 Forbidden"

**Solution:**
1. Verify Vertex AI API is enabled in your project
2. Check service account has `roles/aiplatform.user` permission
3. Ensure you're using the correct project ID

### Error: "Model not found" or "404"

**Possible causes:**
1. Model not available in your selected location
2. Incorrect model name

**Solution:**
- Use `us-central1` location (most models are available there)
- Verify model name is exactly `gemini-2.5-flash-image`

### Images Taking Too Long to Generate

**Typical generation time:** 3-10 seconds

**If slower:**
- Check your network connection
- Try a different `GOOGLE_VERTEX_LOCATION` (closer to you)
- Reduce reference image file size (under 5MB recommended)
- Monitor Google Cloud Console for API quotas/limits

## 📊 Monitoring & Logs

### View API Usage

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Vertex AI** → **Dashboard**
3. See request counts, errors, and latency

### Check Logs

1. Go to **Logging** → **Logs Explorer**
2. Filter by:
   ```
   resource.type="aiplatform.googleapis.com/Endpoint"
   resource.labels.model_id="gemini-2.5-flash-image"
   ```

### Set Up Alerts

1. Go to **Monitoring** → **Alerting**
2. Create alerts for:
   - High error rates
   - Quota approaching limits
   - Unexpected spending

## 🔄 Model Comparison

| Model | Type | Reference Image | Speed | Quality | Cost |
|-------|------|-----------------|-------|---------|------|
| **Gemini 2.5 Flash Image** | Image-to-Image | Required | Fast (3-5s) | Excellent | Very Low ($0.00075) |
| Stability SD 3.5 Large | Text-to-Image | Optional | Fast (2-4s) | Excellent | Low ($0.003) |
| FAL Flux Pro | Text-to-Image | No | Medium (5-8s) | Excellent | Medium ($0.01) |
| DALL-E 3 | Text-to-Image | No | Slow (10-20s) | Excellent | High ($0.04) |

**Use Gemini when:**
- ✅ You have a patient photo or reference image
- ✅ You want consistent character representation
- ✅ You need to transform an existing image
- ✅ You want the lowest cost per image

**Use other models when:**
- ❌ You don't have a reference image (pure text-to-image)
- ❌ You want completely original imagery without a base

## 🚀 Next Steps

1. **Test with a sample image:** Start with a non-patient image to verify setup
2. **Create patient reference images:** Upload patient photos to the database
3. **Experiment with prompts:** Try different transformation styles
4. **Monitor costs:** Check Google Cloud billing after first week
5. **Train therapists:** Show them how to use the feature effectively

## 📚 Additional Resources

- [Vertex AI Documentation](https://cloud.google.com/vertex-ai/docs)
- [Gemini API Reference](https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini)
- [Google Cloud Authentication](https://cloud.google.com/docs/authentication)
- [Service Account Best Practices](https://cloud.google.com/iam/docs/best-practices-for-managing-service-account-keys)
- [HIPAA on Google Cloud](https://cloud.google.com/security/compliance/hipaa)

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check the browser console for detailed error messages
2. Check server logs: `npm run dev` output
3. Review Google Cloud logs (see "Monitoring & Logs" section)
4. Check environment variables are loaded: Add `console.log(process.env.GOOGLE_VERTEX_PROJECT_ID)` temporarily

---

**Last Updated:** 2025-11-06
**Version:** 1.0.0
