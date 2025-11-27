import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { db } from '@/libs/DB';

/**
 * Health Check Endpoint for Google Cloud Run
 *
 * This endpoint is used by Cloud Run for:
 * - Startup probes: Verify container is ready to receive traffic
 * - Liveness probes: Verify container is still running properly
 * - Readiness probes: Verify container can handle requests
 *
 * Cloud Run docs: https://cloud.google.com/run/docs/configuring/healthchecks
 */
export async function GET() {
  try {
    // Check 1: Basic server health
    const startTime = Date.now();

    // Check 2: Database connectivity
    // Execute a simple query to verify database connection
    await db.execute(sql`SELECT 1 as health_check`);

    const responseTime = Date.now() - startTime;

    // Return success response with health status
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected',
        responseTime: `${responseTime}ms`,
        environment: process.env.NODE_ENV || 'development',
      },
      { status: 200 },
    );
  }
  catch (error) {
    // Log error for debugging (will appear in Cloud Run logs)
    console.error('Health check failed:', error);

    // Return unhealthy status
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }, // Service Unavailable
    );
  }
}

// Also support HEAD requests (common for load balancers)
export async function HEAD() {
  try {
    // Quick check without response body
    await db.execute(sql`SELECT 1 as health_check`);
    return new NextResponse(null, { status: 200 });
  }
  catch {
    return new NextResponse(null, { status: 503 });
  }
}
