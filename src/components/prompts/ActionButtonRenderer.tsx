'use client';

/**
 * Action Button Renderer Component
 *
 * Renders action buttons for manual execution blocks in workflows.
 * Handles button clicks and action execution status (pending, processing, completed, failed).
 */

import { useState } from 'react';
import type {
  ActionExecutionRequest,
  ActionExecutionResult,
  BlockInstance,
  WorkflowContext,
} from '@/types/BuildingBlocks';
import { getBlockDefinition } from '@/config/BlockDefinitions';
import { Button } from '@/components/ui/Button';

interface ActionButtonRendererProps {
  block: BlockInstance;
  context: WorkflowContext;
  onExecute: (request: ActionExecutionRequest) => Promise<ActionExecutionResult>;
  onSuccess?: (result: ActionExecutionResult) => void;
  onError?: (error: string) => void;
}

/**
 * Renders an action button for manual execution blocks
 */
export function ActionButtonRenderer({
  block,
  context,
  onExecute,
  onSuccess,
  onError,
}: ActionButtonRendererProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>(
    block.executionStatus || 'pending',
  );
  const [error, setError] = useState<string | undefined>(block.executionError);

  const blockDef = getBlockDefinition(block.blockId);

  if (!blockDef) {
    return <div className="text-red-600">Unknown block type: {block.blockId}</div>;
  }

  // Get button label from block values or use default
  const buttonLabel =
    block.values.button_label || blockDef.label || 'Execute Action';

  const handleClick = async () => {
    setStatus('processing');
    setError(undefined);

    try {
      const result = await onExecute({
        blockInstanceId: block.instanceId,
        blockType: block.blockId,
        values: block.values,
        context,
      });

      if (result.success) {
        setStatus('completed');
        onSuccess?.(result);
      } else {
        setStatus('failed');
        setError(result.error || 'Action failed');
        onError?.(result.error || 'Action failed');
      }
    } catch (err) {
      setStatus('failed');
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  // Render based on block type
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {/* Action Button */}
        <Button
          onClick={handleClick}
          disabled={status === 'processing' || status === 'completed'}
          variant={status === 'completed' ? 'success' : status === 'failed' ? 'danger' : 'primary'}
          size="md"
        >
          {status === 'processing' && (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          )}

          {status === 'completed' && (
            <svg
              className="-ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}

          {status === 'processing'
            ? 'Processing...'
            : status === 'completed'
              ? 'Completed'
              : buttonLabel}
        </Button>

        {/* Status Badge */}
        {status === 'completed' && (
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded">
            Success
          </span>
        )}

        {status === 'failed' && (
          <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded">
            Failed
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && status === 'failed' && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded">
          {error}
        </div>
      )}

      {/* Block Description */}
      {blockDef.description && (
        <p className="text-sm text-gray-600">{blockDef.description}</p>
      )}

      {/* Preview of action configuration */}
      {status === 'pending' && <ActionPreview block={block} />}

      {/* Result preview when completed */}
      {status === 'completed' && block.executionResult && (
        <ActionResult result={block.executionResult} blockType={block.blockId} />
      )}
    </div>
  );
}

/**
 * Preview of what the action will do (before execution)
 */
function ActionPreview({ block }: { block: BlockInstance }) {
  const { values } = block;

  switch (block.blockId) {
    case 'save_quote_action':
      return (
        <div className="p-3 text-sm bg-blue-50 border border-blue-200 rounded">
          <div className="font-medium text-blue-900">Will save quote:</div>
          <div className="mt-1 text-blue-800 italic">
            "{values.quote_source || '[Quote from previous step]'}"
          </div>
          {values.speaker && (
            <div className="mt-1 text-blue-700">- {values.speaker}</div>
          )}
        </div>
      );

    case 'generate_image_action':
      return (
        <div className="p-3 text-sm bg-purple-50 border border-purple-200 rounded">
          <div className="font-medium text-purple-900">Will generate image:</div>
          <div className="mt-1 text-purple-800">
            {values.prompt_template || '[Image prompt from previous step]'}
          </div>
          {values.style && (
            <div className="mt-1 text-purple-700">Style: {values.style}</div>
          )}
        </div>
      );

    case 'generate_music_action':
      return (
        <div className="p-3 text-sm bg-indigo-50 border border-indigo-200 rounded">
          <div className="font-medium text-indigo-900">Will generate music:</div>
          <div className="mt-1 text-indigo-800">
            {values.music_prompt || '[Music prompt from previous step]'}
          </div>
          <div className="mt-1 text-indigo-700">
            Mood: {values.mood || 'calm'} | Duration: {values.duration || 30}s
          </div>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Display result of completed action
 */
function ActionResult({ result, blockType }: { result: any; blockType: string }) {
  switch (blockType) {
    case 'save_quote_action':
      return (
        <div className="p-3 text-sm bg-green-50 border border-green-200 rounded">
          <div className="font-medium text-green-900">✓ Quote saved successfully</div>
          {result.quoteId && (
            <div className="mt-1 text-green-700 text-xs">ID: {result.quoteId}</div>
          )}
        </div>
      );

    case 'generate_image_action':
      return (
        <div className="p-3 text-sm bg-green-50 border border-green-200 rounded space-y-2">
          <div className="font-medium text-green-900">✓ Image generated successfully</div>
          {result.image_url && (
            <img
              src={result.image_url}
              alt="Generated"
              className="w-full max-w-sm rounded border"
            />
          )}
          {result.mediaId && (
            <div className="text-green-700 text-xs">
              Saved to library | ID: {result.mediaId}
            </div>
          )}
        </div>
      );

    case 'generate_music_action':
      return (
        <div className="p-3 text-sm bg-green-50 border border-green-200 rounded space-y-2">
          <div className="font-medium text-green-900">✓ Music generated successfully</div>
          {result.audio_url && (
            <audio controls className="w-full max-w-sm">
              <source src={result.audio_url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          )}
          {result.mediaId && (
            <div className="text-green-700 text-xs">
              Saved to library | ID: {result.mediaId}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="p-3 text-sm bg-green-50 border border-green-200 rounded">
          <div className="font-medium text-green-900">✓ Action completed</div>
          <pre className="mt-1 text-xs text-green-700 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      );
  }
}
