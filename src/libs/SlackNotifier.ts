/**
 * Slack Error Notifier
 *
 * Sends rich error alerts to a Slack channel via an Incoming Webhook.
 * Configure by setting SLACK_ERROR_WEBHOOK_URL in environment variables.
 *
 * HIPAA note: Do NOT pass patient names, DOBs, or any PHI in error payloads.
 * Only include technical identifiers (user IDs, session IDs) and system details.
 */

export type ErrorAlertPayload = {
  /** Human-readable error message */
  message: string;
  /** Full stack trace */
  stack?: string;
  /** Request or page URL */
  url?: string;
  /** HTTP method (GET, POST, …) */
  method?: string;
  /** Raw User-Agent header value */
  userAgent?: string;
  /** Client IP address */
  ip?: string;
  /** Non-PHI user ID (therapist / admin DB id) */
  userId?: string;
  /** Where the error originated */
  source: 'server' | 'client' | 'react';
  /** process.env.NODE_ENV value */
  environment?: string;
};

// ---------------------------------------------------------------------------
// Deduplication — skip if exact same error was reported within the last 5 min
// ---------------------------------------------------------------------------

const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 5 * 60 * 1000;

function getFingerprint(payload: ErrorAlertPayload): string {
  return `${payload.source}:${payload.message.slice(0, 120)}:${payload.url ?? ''}`;
}

function isDuplicate(payload: ErrorAlertPayload): boolean {
  const key = getFingerprint(payload);
  const now = Date.now();
  const lastSeen = recentErrors.get(key);

  if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) {
    return true;
  }

  recentErrors.set(key, now);

  // Prune old entries to avoid unbounded growth
  if (recentErrors.size > 500) {
    for (const [k, ts] of recentErrors.entries()) {
      if (now - ts > DEDUP_WINDOW_MS) recentErrors.delete(k);
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// User-Agent parsing — lightweight, no external dependency
// ---------------------------------------------------------------------------

type UAInfo = { browser: string; browserVersion: string; os: string; device: string };

function parseUserAgent(ua: string): UAInfo {
  let browser = 'Unknown';
  let browserVersion = '';
  let os = 'Unknown';
  let device = 'Desktop';

  // Browser (order matters — Chrome UA contains "Safari" too)
  if (/Edg\/([\d.]+)/.test(ua)) {
    browser = 'Edge';
    browserVersion = ua.match(/Edg\/([\d.]+)/)?.[1] ?? '';
  } else if (/OPR\/([\d.]+)/.test(ua)) {
    browser = 'Opera';
    browserVersion = ua.match(/OPR\/([\d.]+)/)?.[1] ?? '';
  } else if (/SamsungBrowser\/([\d.]+)/.test(ua)) {
    browser = 'Samsung Browser';
    browserVersion = ua.match(/SamsungBrowser\/([\d.]+)/)?.[1] ?? '';
  } else if (/Chrome\/([\d.]+)/.test(ua)) {
    browser = 'Chrome';
    browserVersion = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? '';
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/([\d.]+)/)?.[1] ?? '';
  } else if (/Version\/([\d.]+).*Safari/.test(ua)) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/([\d.]+)/)?.[1] ?? '';
  }

  // OS
  if (/Windows NT ([\d.]+)/.test(ua)) {
    const ntVer = ua.match(/Windows NT ([\d.]+)/)?.[1] ?? '';
    const winMap: Record<string, string> = { '10.0': '10 / 11', '6.3': '8.1', '6.2': '8', '6.1': '7', '6.0': 'Vista', '5.1': 'XP' };
    os = `Windows ${winMap[ntVer] ?? ntVer}`.trim();
  } else if (/iPad|iPhone|iPod/.test(ua)) {
    const ver = ua.match(/(?:iPhone|iPad) OS ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '';
    os = `iOS ${ver}`.trim();
    device = /iPad/.test(ua) ? 'iPad' : 'iPhone';
  } else if (/Android ([\d.]+)/.test(ua)) {
    const ver = ua.match(/Android ([\d.]+)/)?.[1] ?? '';
    os = `Android ${ver}`.trim();
    device = 'Mobile';
  } else if (/Mac OS X ([\d_]+)/.test(ua)) {
    const ver = ua.match(/Mac OS X ([\d_]+)/)?.[1]?.replace(/_/g, '.') ?? '';
    os = `macOS ${ver}`.trim();
  } else if (/CrOS/.test(ua)) {
    os = 'Chrome OS';
    device = 'Chromebook';
  } else if (/Linux/.test(ua)) {
    os = 'Linux';
  }

  if (/Mobile/.test(ua) && device === 'Desktop') device = 'Mobile';

  return { browser, browserVersion, os, device };
}

// ---------------------------------------------------------------------------
// Slack Block Kit message builder
// ---------------------------------------------------------------------------

function truncate(value: string | undefined, max: number): string {
  if (!value) return '_—_';
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function buildBlocks(payload: ErrorAlertPayload): object[] {
  const env = payload.environment ?? process.env.NODE_ENV ?? 'unknown';
  const isProd = env === 'production';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';

  const sourceLabel: Record<ErrorAlertPayload['source'], string> = {
    server: '🖥️ Server',
    client: '🌐 Browser',
    react: '⚛️ React',
  };
  const envBadge = isProd ? '🔴 *PRODUCTION*' : '🟡 *Development*';
  const ua = payload.userAgent ? parseUserAgent(payload.userAgent) : null;

  const blocks: object[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `StoryCare Error — ${sourceLabel[payload.source]}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${envBadge}   •   ${new Date().toUTCString()}\n\n*${truncate(payload.message, 250)}*`,
      },
    },
    { type: 'divider' },
    // Request info
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Source*\n${sourceLabel[payload.source]}` },
        { type: 'mrkdwn', text: `*Environment*\n${env}` },
        { type: 'mrkdwn', text: `*Method*\n${payload.method ?? '_—_'}` },
        { type: 'mrkdwn', text: `*User ID*\n${payload.userId ? `\`${payload.userId}\`` : '_not available_'}` },
      ],
    },
  ];

  // URL row
  if (payload.url) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*URL / Route*\n\`${truncate(payload.url, 400)}\``,
      },
    });
  }

  // Browser / OS / Device / IP
  if (ua) {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Browser*\n${ua.browser}${ua.browserVersion ? ` ${ua.browserVersion}` : ''}` },
        { type: 'mrkdwn', text: `*OS*\n${ua.os}` },
        { type: 'mrkdwn', text: `*Device*\n${ua.device}` },
        { type: 'mrkdwn', text: `*IP Address*\n${payload.ip ?? '_unknown_'}` },
      ],
    });
    // Raw UA for completeness
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `*User-Agent:* ${truncate(payload.userAgent, 300)}`,
        },
      ],
    });
  } else if (payload.ip) {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*IP Address*\n${payload.ip}` },
      ],
    });
  }

  // Stack trace
  if (payload.stack) {
    const stackExcerpt = payload.stack
      .split('\n')
      .slice(0, 20)
      .join('\n');
    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          // Slack code blocks have a ~3000 char limit per block
          text: `*Stack Trace*\n\`\`\`${truncate(stackExcerpt, 2800)}\`\`\``,
        },
      },
    );
  }

  // Action buttons — only add buttons whose urls are non-empty strings
  // (Slack rejects blocks with empty url fields)
  const actionButtons: object[] = [];
  if (appUrl) {
    actionButtons.push({
      type: 'button',
      text: { type: 'plain_text', text: '🔗 Open App', emoji: true },
      url: appUrl,
      action_id: 'open_app',
    });
  }
  actionButtons.push({
    type: 'button',
    text: { type: 'plain_text', text: '📋 Vercel Logs', emoji: true },
    url: 'https://vercel.com/stevewalturn/story-care/logs',
    action_id: 'view_logs',
    style: isProd ? 'danger' : 'primary',
  });

  blocks.push(
    { type: 'divider' },
    { type: 'actions', elements: actionButtons },
  );

  return blocks;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send an error alert to the configured Slack channel.
 * Silently no-ops if SLACK_ERROR_WEBHOOK_URL is not set.
 * Deduplicates identical errors within a 5-minute window.
 */
export async function sendErrorAlert(payload: ErrorAlertPayload): Promise<void> {
  const webhookUrl = process.env.SLACK_ERROR_WEBHOOK_URL;
  if (!webhookUrl) return;

  if (isDuplicate(payload)) return;

  try {
    const blocks = buildBlocks(payload);
    const body = JSON.stringify({
      text: `[${payload.source.toUpperCase()}] StoryCare Error: ${payload.message.slice(0, 100)}`,
      blocks,
    });

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    // Slack returns plain-text "ok" on success, or an error string on failure
    if (!res.ok) {
      const responseText = await res.text().catch(() => '(unreadable)');
      console.error('[SlackNotifier] Webhook returned non-OK status:', res.status, responseText);
    }
  } catch (err) {
    // Never throw from error reporting — silently log to console only
    console.error('[SlackNotifier] Failed to send Slack alert (non-blocking):', err instanceof Error ? err.message : err);
  }
}
