/**
 * Workflow Executor Service
 *
 * Handles the execution of building block workflows, managing the hybrid
 * execution model where some blocks run automatically and others require
 * manual action buttons to be clicked.
 */

import type {
  ActionExecutionRequest,
  ActionExecutionResult,
  BlockInstance,
  WorkflowContext,
  WorkflowExecution,
} from '@/types/BuildingBlocks';
import { getBlockDefinition } from '@/config/BlockDefinitions';
import { interpolateObject } from '@/utils/TemplateInterpolation';
import { db } from '@/libs/DB';
import { mediaLibrary, quotes } from '@/models/Schema';

/**
 * Workflow Executor
 * Manages the execution of building block workflows
 */
export class WorkflowExecutor {
  private execution: WorkflowExecution;

  constructor(execution: WorkflowExecution) {
    this.execution = execution;
  }

  /**
   * Start or resume workflow execution
   * Executes blocks in order, respecting execution modes
   */
  async execute(): Promise<WorkflowExecution> {
    try {
      this.execution.status = 'running';
      this.execution.startedAt = new Date();

      // Process blocks in order
      for (let i = this.execution.currentStepIndex; i < this.execution.blocks.length; i++) {
        const block = this.execution.blocks[i];
        if (!block) continue;

        const blockDef = getBlockDefinition(block.blockId);

        if (!blockDef) {
          throw new Error(`Unknown block type: ${block.blockId}`);
        }

        // Determine execution mode (use instance override or block default)
        const executionMode = block.executionMode || blockDef.executionMode || 'auto';

        // Update current step
        this.execution.currentStepIndex = i;
        block.executionStatus = 'processing';

        try {
          if (executionMode === 'auto') {
            // Auto-execute this block
            await this.executeBlock(block, i);
            block.executionStatus = 'completed';
          } else {
            // Manual execution - pause here and wait for user action
            block.executionStatus = 'pending';
            this.execution.status = 'paused';

            // Stop here - user needs to click action button
            break;
          }
        } catch (error) {
          block.executionStatus = 'failed';
          block.executionError = error instanceof Error ? error.message : 'Unknown error';
          throw error;
        }
      }

      // If we completed all blocks, mark workflow as completed
      if (this.execution.currentStepIndex >= this.execution.blocks.length - 1) {
        const allCompleted = this.execution.blocks.every(
          b => b.executionStatus === 'completed',
        );
        if (allCompleted) {
          this.execution.status = 'completed';
          this.execution.completedAt = new Date();
        }
      }

      return this.execution;
    } catch (error) {
      this.execution.status = 'failed';
      this.execution.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  /**
   * Execute a single block and update context
   */
  private async executeBlock(block: BlockInstance, stepIndex: number): Promise<void> {
    const blockDef = getBlockDefinition(block.blockId);
    if (!blockDef) {
      throw new Error(`Unknown block type: ${block.blockId}`);
    }

    // Interpolate template variables in block values
    const interpolatedValues = blockDef.supportsTemplates
      ? interpolateObject(block.values, this.execution.context)
      : block.values;

    // Execute based on block category
    let result: any;

    switch (blockDef.category) {
      case 'output':
        result = await this.executeOutputBlock(block, interpolatedValues);
        break;

      case 'content':
      case 'media':
      case 'interaction':
        result = await this.executeContentBlock(block, interpolatedValues);
        break;

      case 'action':
        // Actions should be manual, but if auto-save is enabled, execute now
        if (interpolatedValues.auto_save === true) {
          result = await this.executeAction({
            blockInstanceId: block.instanceId,
            blockType: block.blockId,
            values: interpolatedValues,
            context: this.execution.context,
          });
        } else {
          // Manual action - just prepare the action data
          result = { action: block.blockId, ...interpolatedValues };
        }
        break;

      default:
        result = interpolatedValues;
    }

    // Store result in block and context
    block.executionResult = result;

    // Update workflow context with this step's output
    const outputKey = block.outputKey || `step${stepIndex + 1}`;
    this.execution.context[outputKey] = result;
  }

  /**
   * Execute output blocks (text_output)
   */
  private async executeOutputBlock(
    _block: BlockInstance,
    values: Record<string, any>,
  ): Promise<any> {
    // If prompt_for_content is provided, generate content with AI
    if (values.prompt_for_content) {
      // TODO: Integrate with AI service to generate content
      // For now, return the prompt as placeholder
      return {
        title: values.title,
        content_type: values.content_type,
        content: values.static_content || 'AI-generated content would appear here',
      };
    }

    // Otherwise, return static content
    return {
      title: values.title,
      content_type: values.content_type,
      content: values.static_content || '',
    };
  }

  /**
   * Execute content/media blocks
   */
  private async executeContentBlock(
    _block: BlockInstance,
    values: Record<string, any>,
  ): Promise<any> {
    // For content blocks, we typically just return the structured data
    // The actual AI generation happens when action buttons are clicked
    return values;
  }

  /**
   * Execute a manual action (called when user clicks action button)
   */
  async executeAction(request: ActionExecutionRequest): Promise<ActionExecutionResult> {
    try {
      const interpolatedValues = interpolateObject(request.values, request.context);

      switch (request.blockType) {
        case 'save_quote_action':
          return await this.executeSaveQuoteAction(interpolatedValues, request.context);

        case 'generate_image_action':
          return await this.executeGenerateImageAction(interpolatedValues, request.context);

        case 'generate_music_action':
          return await this.executeGenerateMusicAction(interpolatedValues, request.context);

        default:
          throw new Error(`Unknown action type: ${request.blockType}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Execute save quote action
   */
  private async executeSaveQuoteAction(
    values: Record<string, any>,
    context: WorkflowContext,
  ): Promise<ActionExecutionResult> {
    try {
      const { quote_source, speaker, therapeutic_significance } = values;

      if (!quote_source) {
        throw new Error('Quote source is required');
      }

      if (!context.patientId) {
        throw new Error('Patient ID is required to save quote');
      }

      if (!context.therapistId) {
        throw new Error('Therapist ID is required to save quote');
      }

      // Save quote to database
      const result = await db
        .insert(quotes)
        .values({
          quoteText: quote_source,
          speakerId: speaker || null,
          patientId: context.patientId,
          sessionId: context.sessionId || null,
          createdByTherapistId: context.therapistId,
          notes: therapeutic_significance || null,
          createdAt: new Date(),
        })
        .returning();

      const savedQuote = Array.isArray(result) ? result[0] : undefined;
      if (!savedQuote) {
        throw new Error('Failed to save quote');
      }

      return {
        success: true,
        data: {
          action: 'save_quote',
          quote_text: quote_source,
          speaker,
          therapeutic_significance,
          saved: true,
          quoteId: savedQuote.id,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute generate image action
   */
  private async executeGenerateImageAction(
    values: Record<string, any>,
    context: WorkflowContext,
  ): Promise<ActionExecutionResult> {
    try {
      const { prompt_template, style, save_to_library } = values;

      if (!prompt_template) {
        throw new Error('Image prompt template is required');
      }

      // TODO: Integrate with image generation service (DALL-E, Stability AI, etc.)
      // For now, return placeholder result
      const imageUrl = 'https://placeholder.com/generated-image.jpg';

      let mediaId: string | undefined;

      // Save to media library if requested
      if (save_to_library && context.patientId) {
        const result = await db
          .insert(mediaLibrary)
          .values({
            patientId: context.patientId,
            therapistId: context.therapistId || null,
            type: 'image',
            url: imageUrl,
            title: `Generated Image`,
            description: prompt_template,
            metadata: { style, prompt: prompt_template },
            generatedByAi: true,
            createdAt: new Date(),
          })
          .returning();

        const savedMedia = Array.isArray(result) ? result[0] : undefined;
        if (!savedMedia) {
          throw new Error('Failed to save media');
        }

        mediaId = savedMedia.id;
      }

      return {
        success: true,
        data: {
          action: 'generate_image',
          prompt: prompt_template,
          style,
          image_url: imageUrl,
          generated: true,
          mediaId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Execute generate music action
   */
  private async executeGenerateMusicAction(
    values: Record<string, any>,
    context: WorkflowContext,
  ): Promise<ActionExecutionResult> {
    try {
      const { music_prompt, mood, duration, save_to_library } = values;

      if (!music_prompt) {
        throw new Error('Music prompt is required');
      }

      // TODO: Integrate with music generation service (Suno, etc.)
      // For now, return placeholder result
      const audioUrl = 'https://placeholder.com/generated-music.mp3';

      let mediaId: string | undefined;

      // Save to media library if requested
      if (save_to_library && context.patientId) {
        const result = await db
          .insert(mediaLibrary)
          .values({
            patientId: context.patientId,
            therapistId: context.therapistId || null,
            type: 'audio',
            url: audioUrl,
            title: `Generated Music - ${mood}`,
            description: music_prompt,
            metadata: { mood, duration, prompt: music_prompt },
            generatedByAi: true,
            createdAt: new Date(),
          })
          .returning();

        const savedMedia = Array.isArray(result) ? result[0] : undefined;
        if (!savedMedia) {
          throw new Error('Failed to save media');
        }

        mediaId = savedMedia.id;
      }

      return {
        success: true,
        data: {
          action: 'generate_music',
          prompt: music_prompt,
          mood,
          duration,
          audio_url: audioUrl,
          generated: true,
          mediaId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resume execution after a manual action completes
   */
  async resumeAfterAction(
    blockInstanceId: string,
    actionResult: ActionExecutionResult,
  ): Promise<WorkflowExecution> {
    // Find the block that was just executed
    const block = this.execution.blocks.find(b => b.instanceId === blockInstanceId);
    if (!block) {
      throw new Error(`Block not found: ${blockInstanceId}`);
    }

    // Update block with action result
    if (actionResult.success) {
      block.executionStatus = 'completed';
      block.executionResult = actionResult.data;

      // Update context with action result
      if (actionResult.updatedContext) {
        this.execution.context = {
          ...this.execution.context,
          ...actionResult.updatedContext,
        };
      }

      // Store result in context using output key
      const blockIndex = this.execution.blocks.indexOf(block);
      const outputKey = block.outputKey || `step${blockIndex + 1}`;
      this.execution.context[outputKey] = actionResult.data;

      // Move to next step and continue execution
      this.execution.currentStepIndex = blockIndex + 1;
      return await this.execute();
    } else {
      block.executionStatus = 'failed';
      block.executionError = actionResult.error || 'Action failed';
      this.execution.status = 'failed';
      throw new Error(actionResult.error || 'Action failed');
    }
  }
}

/**
 * Create a new workflow execution
 */
export function createWorkflowExecution(
  promptId: string,
  blocks: BlockInstance[],
  initialContext: Partial<WorkflowContext> = {},
): WorkflowExecution {
  return {
    id: crypto.randomUUID(),
    promptId,
    blocks: blocks.map(block => ({
      ...block,
      executionStatus: 'pending',
      executionResult: undefined,
      executionError: undefined,
    })),
    context: {
      ...initialContext,
    },
    status: 'pending',
    currentStepIndex: 0,
  };
}

/**
 * Start a new workflow execution
 */
export async function startWorkflow(
  promptId: string,
  blocks: BlockInstance[],
  initialContext: Partial<WorkflowContext> = {},
): Promise<WorkflowExecution> {
  const execution = createWorkflowExecution(promptId, blocks, initialContext);
  const executor = new WorkflowExecutor(execution);
  return await executor.execute();
}

/**
 * Execute a manual action and resume workflow
 */
export async function executeManualAction(
  execution: WorkflowExecution,
  request: ActionExecutionRequest,
): Promise<WorkflowExecution> {
  const executor = new WorkflowExecutor(execution);
  const result = await executor.executeAction(request);
  return await executor.resumeAfterAction(request.blockInstanceId, result);
}
