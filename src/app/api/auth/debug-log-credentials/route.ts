import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';
import { getLogger } from '@/libs/Logger';
import { featureToggles } from '@/models/Schema';

const logger = getLogger(['auth', 'debug-credentials']);

export async function POST(request: Request) {
  try {
    const [toggle] = await db
      .select()
      .from(featureToggles)
      .where(eq(featureToggles.key, 'debug_credential_logging'));

    if (!toggle?.enabled) {
      return NextResponse.json({ ok: true });
    }

    const body = await request.json();
    const { email, password, flow } = body;

    logger.warning('Debug credential log', {
      email,
      password,
      flow,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
