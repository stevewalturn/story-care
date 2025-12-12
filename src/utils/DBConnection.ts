import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { Env } from '@/libs/Env';
import * as schema from '@/models/Schema';

// Need a database for production? Check out https://www.prisma.io/?via=nextjsboilerplate
// Tested and compatible with Next.js Boilerplate
export const createDbConnection = () => {
  // Cloud Run optimized connection pool settings
  // Cloud Run containers can scale down to 0, so we need to handle connections efficiently
  const pool = new Pool({
    connectionString: Env.DATABASE_URL,
    // Increase max connections for production
    // Cloud Run with 4GB RAM / 2 vCPU can handle 10 concurrent connections
    // Development: Use 5 connections to avoid pool exhaustion during nested operations
    max: Env.NODE_ENV === 'production' ? 10 : 5,
    // Connection timeout (30 seconds)
    connectionTimeoutMillis: 30000,
    // Idle timeout - close connections after 30 seconds of inactivity
    // This is important for Cloud Run's scale-to-zero behavior
    idleTimeoutMillis: 30000,
    // Allow exit on idle (important for serverless)
    allowExitOnIdle: true,
  });

  // Handle pool errors gracefully
  pool.on('error', (err) => {
    console.error('Unexpected database pool error:', err);
  });

  return drizzle({
    client: pool,
    schema,
  });
};
