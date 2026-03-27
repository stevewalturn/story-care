import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { ErrorAlertPayload } from '@/libs/SlackNotifier';
import { sendErrorAlert } from '@/libs/SlackNotifier';
import { checkRateLimit, getClientIP } from '@/utils/RateLimiter';

// Max 10 error reports per IP per minute — protects Slack from flooding
const CLIENT_ERROR_RATE_LIMIT = { windowMs: 60_000, maxRequests: 10 };

/**
 * POST /api/internal/client-error
 *
 * Receives client-side / React error reports from the browser and forwards
 * them to Slack. No auth required — errors can happen before/outside auth.
 * Rate-limited by IP to prevent abuse.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(`client-error:${ip}`, CLIENT_ERROR_RATE_LIMIT);

  if (!rateLimit.allowed) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  try {
    const body = await request.json() as {
      message?: string;
      stack?: string;
      url?: string;
      source?: ErrorAlertPayload['source'];
      userId?: string;
    };

    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    await sendErrorAlert({
      message: body.message,
      stack: typeof body.stack === 'string' ? body.stack : undefined,
      url: typeof body.url === 'string' ? body.url : undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      ip,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
      source: body.source === 'react' ? 'react' : 'client',
      environment: process.env.NODE_ENV,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
