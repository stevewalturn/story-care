/**
 * Public feature flags endpoint
 * Returns platform feature toggles for authenticated users
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { platformSettingsSchema } from '@/models/Schema';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    await verifyIdToken(authHeader.substring(7));

    const [settings] = await db.select().from(platformSettingsSchema).limit(1);

    return NextResponse.json({
      enablePhoneVerification: settings?.enablePhoneVerification ?? false,
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
