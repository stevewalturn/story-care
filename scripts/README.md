# Database Seeding Scripts

## Seed Super Admin User

This script creates or updates a super admin user in the database.

### Prerequisites

1. **Create a Firebase user first** (one of these methods):
   - Option A: Use Firebase Console (Authentication > Users > Add User)
   - Option B: Sign up via the StoryCare sign-up page
   - Option C: Use Firebase Admin SDK

2. **Get the Firebase UID**:
   - Go to Firebase Console > Authentication > Users
   - Find your user and copy the **User UID**

### Usage

#### Method 1: With environment variables

```bash
SUPER_ADMIN_FIREBASE_UID=your-firebase-uid-here \
SUPER_ADMIN_EMAIL=admin@storycare.com \
SUPER_ADMIN_NAME="Super Admin" \
npm run db:seed-superadmin
```

#### Method 2: Quick command (defaults to admin@storycare.com)

```bash
SUPER_ADMIN_FIREBASE_UID=your-firebase-uid-here npm run db:seed-superadmin
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPER_ADMIN_FIREBASE_UID` | ✅ Yes | - | Firebase User UID (get from Firebase Console) |
| `SUPER_ADMIN_EMAIL` | No | `admin@storycare.com` | Email address for the super admin |
| `SUPER_ADMIN_NAME` | No | `Super Admin` | Display name for the super admin |

### Example

```bash
# Step 1: Create a Firebase user via sign-up page or Firebase Console
# Copy the Firebase UID (e.g., "abc123xyz456")

# Step 2: Run the seed script
SUPER_ADMIN_FIREBASE_UID=abc123xyz456 npm run db:seed-superadmin
```

### What it does

1. Checks if a user with the Firebase UID already exists
2. If exists: Updates the user to super_admin role and active status
3. If not: Creates a new user with super_admin role
4. Sets organizationId to null (super admins are platform-wide)

### Output

Success:
```
🌱 Seeding super admin user...

✅ Super admin user created successfully!
   Email: admin@storycare.com
   Name: Super Admin
   Role: super_admin
   Status: active
   Firebase UID: abc123xyz456

🎉 Done! You can now sign in with this account.
```

### Troubleshooting

**Error: SUPER_ADMIN_FIREBASE_UID is required**
- You forgot to provide the Firebase UID
- Make sure you created a Firebase user first

**Error: User already exists**
- The script will update the existing user to super_admin
- This is safe and expected

**Error: Database connection failed**
- Make sure your database is running
- Check your `DATABASE_URL` in `.env.local`
