'use client';

/**
 * UniversalBlockRenderer Component
 *
 * Renders ANY JSON output from block-based prompts as visual UI.
 * Supports both auto-execute outputs and manual action buttons.
 *
 * Phase 1 Implementation:
 * - Takes blocks + JSON output
 * - Maps each block to its corresponding output display
 * - Renders action blocks as buttons
 * - Uses block definitions to determine rendering style
 */

import type { ActionExecutionRequest, BlockInstance, WorkflowContext } from '@/types/BuildingBlocks';
import {
  AlertCircle,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Music,
  Quote as QuoteIcon,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { getBlockDefinition } from '@/config/BlockDefinitions';

type UniversalBlockRendererProps = {
  blocks: BlockInstance[];
  jsonOutput: any;
  context?: WorkflowContext;
  onActionExecute?: (request: ActionExecutionRequest) => Promise<{ success: boolean; data?: any; error?: string }>;
  sessionId?: string;
  user?: any;
};

type ActionButtonProps = {
  block: BlockInstance;
  context: WorkflowContext;
  onExecute: (request: ActionExecutionRequest) => Promise<{ success: boolean; data?: any; error?: string }>;
};

/**
 * Renders an action button for manual execution blocks
 */
function ActionButton({ block, context, onExecute }: ActionButtonProps) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>(
    block.executionStatus || 'pending',
  );
  const [error, setError] = useState<string | null>(null);

  const blockDef = getBlockDefinition(block.blockId);
  if (!blockDef) return null;

  const buttonLabel = block.values.button_label || blockDef.label;

  const handleClick = async () => {
    setStatus('processing');
    setError(null);

    try {
      const result = await onExecute({
        blockInstanceId: block.instanceId,
        blockType: block.blockId,
        values: block.values,
        context,
      });

      if (result.success) {
        setStatus('completed');
      } else {
        setStatus('failed');
        setError(result.error || 'Action failed');
      }
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const isDisabled = status === 'processing' || status === 'completed';

  // Icon based on block type
  const getIcon = () => {
    switch (block.blockId) {
      case 'save_quote_action':
        return <Bookmark className="h-4 w-4" />;
      case 'generate_image_action':
        return <Sparkles className="h-4 w-4" />;
      case 'generate_music_action':
        return <Music className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return getIcon();
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={isDisabled}
        className={`
          flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
          transition-all disabled:cursor-not-allowed disabled:opacity-50
          ${status === 'completed'
      ? 'border border-green-300 bg-green-100 text-green-800'
      : status === 'failed'
        ? 'border border-red-300 bg-red-100 text-red-800'
        : 'bg-purple-600 text-white hover:bg-purple-700'
    }
        `}
      >
        {getStatusIcon()}
        {status === 'processing'
          ? 'Processing...'
          : status === 'completed'
            ? 'Completed'
            : status === 'failed'
              ? 'Failed - Try Again'
              : buttonLabel}
      </button>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}

/**
 * Renders text output blocks
 */
function TextOutputRenderer({ block, output }: { block: BlockInstance; output: any }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const title = output?.title || block.values.title || 'Text Output';
  const content = output?.content || output?.text || '';
  const contentType = output?.content_type || block.values.content_type || 'text';

  const getIcon = () => {
    switch (contentType) {
      case 'lyrics':
        return <Music className="h-5 w-5 text-purple-600" />;
      case 'story':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'instructions':
        return <MessageCircle className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            {getIcon()}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{title}</h4>
            <p className="text-xs text-gray-500 capitalize">{contentType}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>

      {isExpanded && content && (
        <div className="border-t border-gray-200 p-4">
          <div className={`
            text-sm whitespace-pre-wrap text-gray-700
            ${contentType === 'lyrics' ? 'font-mono' : ''}
          `}
          >
            {content}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders image output blocks
 */
function ImageOutputRenderer({ block, output }: { block: BlockInstance; output: any }) {
  const title = output?.title || block.values.title || 'Generated Image';
  const imageUrl = output?.image_url || output?.url;
  const prompt = output?.prompt || block.values.prompt;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-purple-50 p-4">
        <div className="rounded-lg bg-white p-2">
          <ImageIcon className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          <p className="text-xs text-gray-500">Image Prompt</p>
        </div>
      </div>

      {imageUrl && (
        <div className="p-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-full rounded-lg"
          />
        </div>
      )}

      {prompt && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <p className="mb-1 text-xs font-medium text-gray-600">Prompt:</p>
          <p className="text-sm text-gray-700">{prompt}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Renders music output blocks
 */
function MusicOutputRenderer({ block, output }: { block: BlockInstance; output: any }) {
  const title = output?.title || block.values.title || 'Generated Music';
  const audioUrl = output?.audio_url || output?.url;
  const lyrics = output?.lyrics;
  const musicStyle = output?.music_style || block.values.music_style;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 bg-gradient-to-r from-pink-50 to-purple-50 p-4">
        <div className="rounded-lg bg-white p-2">
          <Music className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{title}</h4>
          {musicStyle && <p className="text-xs text-gray-500">{musicStyle}</p>}
        </div>
      </div>

      {audioUrl && (
        <div className="p-4">
          <audio controls className="w-full">
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}

      {lyrics && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-medium text-gray-600">Lyrics:</p>
          <p className="font-mono text-sm whitespace-pre-wrap text-gray-700">{lyrics}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Renders quote output blocks
 */
function QuoteOutputRenderer({ block, output }: { block: BlockInstance; output: any }) {
  const quoteText = output?.quote_text || output?.text || block.values.quote_source;
  const speaker = output?.speaker || block.values.speaker;
  const significance = output?.therapeutic_significance || block.values.therapeutic_significance;

  return (
    <div className="rounded-lg border-l-4 border-purple-600 bg-gradient-to-r from-purple-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <QuoteIcon className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" />
        <div className="flex-1">
          <blockquote className="mb-2 text-base text-gray-900 italic">
            "
            {quoteText}
            "
          </blockquote>
          {speaker && (
            <p className="mb-2 text-sm text-gray-600">
              —
              {speaker}
            </p>
          )}
          {significance && (
            <div className="mt-3 border-t border-purple-200 pt-3">
              <p className="mb-1 text-xs font-medium text-gray-600">Therapeutic Significance:</p>
              <p className="text-sm text-gray-700">{significance}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Generic fallback renderer for unknown block types
 */
function GenericOutputRenderer({ block, output }: { block: BlockInstance; output: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const blockDef = getBlockDefinition(block.blockId);
  const title = blockDef?.label || 'Output';

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="flex cursor-pointer items-center justify-between p-4 hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gray-100 p-2">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <h4 className="font-medium text-gray-900">{title}</h4>
        </div>
        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <pre className="rounded bg-gray-50 p-3 text-xs whitespace-pre-wrap text-gray-700">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

/**
 * Main UniversalBlockRenderer Component
 */
export function UniversalBlockRenderer({
  blocks,
  jsonOutput,
  context = {},
  onActionExecute,
  sessionId,
  user,
}: UniversalBlockRendererProps) {
  // Build workflow context if not provided
  const workflowContext: WorkflowContext = {
    ...context,
    sessionId,
    userId: user?.id,
  };

  /**
   * Render a single block based on its type and execution mode
   * Uses outputDisplay metadata from block definitions when available
   */
  const renderBlock = (block: BlockInstance, index: number) => {
    const blockDef = getBlockDefinition(block.blockId);
    if (!blockDef) {
      return <GenericOutputRenderer key={block.instanceId} block={block} output={jsonOutput} />;
    }

    const executionMode = block.executionMode || blockDef.executionMode || 'auto';
    const outputKey = block.outputKey || `step${index + 1}`;
    const output = jsonOutput?.[outputKey] || jsonOutput;

    // Action blocks (manual execution)
    if (blockDef.category === 'action' || executionMode === 'manual') {
      if (!onActionExecute) {
        return null; // No action handler provided
      }

      return (
        <div key={block.instanceId}>
          <ActionButton
            block={block}
            context={workflowContext}
            onExecute={onActionExecute}
          />
        </div>
      );
    }

    // Output blocks (auto execution) - render based on outputDisplay metadata
    if (blockDef.outputDisplay) {
      switch (blockDef.outputDisplay.renderAs) {
        case 'text':
          return <TextOutputRenderer key={block.instanceId} block={block} output={output} />;
        case 'image':
          return <ImageOutputRenderer key={block.instanceId} block={block} output={output} />;
        case 'audio':
          return <MusicOutputRenderer key={block.instanceId} block={block} output={output} />;
        case 'quote':
          return <QuoteOutputRenderer key={block.instanceId} block={block} output={output} />;
        default:
          return <GenericOutputRenderer key={block.instanceId} block={block} output={output} />;
      }
    }

    // Fallback: render based on legacy block type (for backwards compatibility)
    switch (block.blockId) {
      case 'text_output':
        return <TextOutputRenderer key={block.instanceId} block={block} output={output} />;
      case 'image_prompt':
        return <ImageOutputRenderer key={block.instanceId} block={block} output={output} />;
      case 'music_generation':
        return <MusicOutputRenderer key={block.instanceId} block={block} output={output} />;
      case 'quote':
        return <QuoteOutputRenderer key={block.instanceId} block={block} output={output} />;
      default:
        return <GenericOutputRenderer key={block.instanceId} block={block} output={output} />;
    }
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => renderBlock(block, index))}

      {blocks.length === 0 && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-600">No blocks to display</p>
        </div>
      )}
    </div>
  );
}
