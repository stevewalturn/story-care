/**
 * Workflow Execution API Endpoint
 *
 * POST /api/workflows/execute - Start a new workflow execution
 * POST /api/workflows/execute/action - Execute a manual action and resume workflow
 * GET /api/workflows/execute/[id] - Get workflow execution status
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyIdToken } from '@/libs/FirebaseAdmin';
import { db } from '@/libs/DB';
import { workflowExecutions, moduleAiPrompts } from '@/models/Schema';
import { eq } from 'drizzle-orm';
import {
  createWorkflowExecution,
  executeManualAction,
  WorkflowExecutor,
} from '@/services/WorkflowExecutorService';
import type {
  ActionExecutionRequest,
  BlockInstance,
  WorkflowContext,
  WorkflowExecution,
} from '@/types/BuildingBlocks';

// Validation schemas
const startWorkflowSchema = z.object({
  promptId: z.string().uuid(),
  blocks: z.array(z.any()), // BlockInstance[] (complex shape, validated at runtime)
  context: z.object({
    sessionId: z.string().uuid().optional(),
    patientId: z.string().uuid().optional(),
    therapistId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
  }),
});

const executeActionSchema = z.object({
  executionId: z.string().uuid(),
  blockInstanceId: z.string(),
  blockType: z.string(),
  values: z.record(z.any()),
});

/**
 * POST /api/workflows/execute
 * Start a new workflow execution
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const user = await verifyIdToken(token);

    // Parse and validate request body
    const body = await request.json();
    const validated = startWorkflowSchema.parse(body);

    // Verify prompt exists
    const prompt = await db
      .select()
      .from(moduleAiPrompts)
      .where(eq(moduleAiPrompts.id, validated.promptId))
      .limit(1);

    if (!prompt.length) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    // Enrich context with user info
    const enrichedContext: Partial<WorkflowContext> = {
      ...validated.context,
      therapistId: validated.context.therapistId || user.uid,
    };

    // Create workflow execution
    const execution = createWorkflowExecution(
      validated.promptId,
      validated.blocks as BlockInstance[],
      enrichedContext,
    );

    // Start execution
    const executor = new WorkflowExecutor(execution);
    const result = await executor.execute();

    // Save execution state to database
    await db.insert(workflowExecutions).values({
      id: result.id,
      promptId: result.promptId,
      blocks: result.blocks as any,
      context: result.context as any,
      initialContext: enrichedContext as any,
      status: result.status,
      currentStepIndex: result.currentStepIndex,
      error: result.error,
      sessionId: enrichedContext.sessionId,
      patientId: enrichedContext.patientId,
      therapistId: enrichedContext.therapistId,
      organizationId: enrichedContext.organizationId,
      startedAt: result.startedAt,
      completedAt: result.completedAt,
    });

    return NextResponse.json({
      success: true,
      execution: result,
    });
  } catch (error) {
    console.error('Workflow execution error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/workflows/execute (for action execution)
 * Execute a manual action and resume workflow
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyIdToken(token);

    // Parse and validate request body
    const body = await request.json();
    const validated = executeActionSchema.parse(body);

    // Fetch existing execution from database
    const existingExecutions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, validated.executionId))
      .limit(1);

    if (!existingExecutions.length) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const existing = existingExecutions[0];

    // Reconstruct WorkflowExecution object
    const execution: WorkflowExecution = {
      id: existing.id,
      promptId: existing.promptId,
      blocks: existing.blocks as BlockInstance[],
      context: existing.context as WorkflowContext,
      status: existing.status as any,
      currentStepIndex: existing.currentStepIndex,
      startedAt: existing.startedAt || undefined,
      completedAt: existing.completedAt || undefined,
      error: existing.error || undefined,
    };

    // Execute action
    const actionRequest: ActionExecutionRequest = {
      blockInstanceId: validated.blockInstanceId,
      blockType: validated.blockType as any,
      values: validated.values,
      context: execution.context,
    };

    const result = await executeManualAction(execution, actionRequest);

    // Update execution in database
    await db
      .update(workflowExecutions)
      .set({
        blocks: result.blocks as any,
        context: result.context as any,
        status: result.status,
        currentStepIndex: result.currentStepIndex,
        error: result.error,
        completedAt: result.completedAt,
        updatedAt: new Date(),
      })
      .where(eq(workflowExecutions.id, result.id));

    return NextResponse.json({
      success: true,
      execution: result,
    });
  } catch (error) {
    console.error('Action execution error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to execute action', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/workflows/execute?id=xxx
 * Get workflow execution status
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await verifyIdToken(token);

    // Get execution ID from query params
    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('id');

    if (!executionId) {
      return NextResponse.json({ error: 'Execution ID is required' }, { status: 400 });
    }

    // Fetch execution from database
    const executions = await db
      .select()
      .from(workflowExecutions)
      .where(eq(workflowExecutions.id, executionId))
      .limit(1);

    if (!executions.length) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    const execution = executions[0];

    return NextResponse.json({
      success: true,
      execution: {
        id: execution.id,
        promptId: execution.promptId,
        blocks: execution.blocks,
        context: execution.context,
        status: execution.status,
        currentStepIndex: execution.currentStepIndex,
        error: execution.error,
        startedAt: execution.startedAt,
        completedAt: execution.completedAt,
        createdAt: execution.createdAt,
        updatedAt: execution.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get execution error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch execution', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
