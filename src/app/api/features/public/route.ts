/**
 * Public feature flags endpoint (no auth required)
 * Only exposes flags that are safe to reveal to unauthenticated users.
 */
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { platformSettingsSchema } from '@/models/Schema';

export async function GET() {
  try {
    const [settings] = await db.select().from(platformSettingsSchema).limit(1);
    return NextResponse.json({
      enablePhoneVerification: settings?.enablePhoneVerification ?? false,
    });
  } catch {
    return NextResponse.json({ enablePhoneVerification: false });
  }
}
