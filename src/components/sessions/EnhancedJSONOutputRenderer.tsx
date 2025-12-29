'use client';

/**
 * EnhancedJSONOutputRenderer Component
 *
 * Universal JSON output renderer that handles BOTH:
 * 1. Block-based prompts (new system) - Uses UniversalBlockRenderer
 * 2. Schema-based prompts (legacy system) - Uses existing JSONOutputRenderer
 * 3. Generic JSON (fallback) - Uses GenericJSONDisplay
 *
 * Phase 3 Implementation: Replace Hardcoded Renderers
 */

import type { BlockInstance } from '@/types/BuildingBlocks';
import type { AnyJSONSchema, JSONSchemaType } from '@/types/JSONSchemas';
import { useCallback, useState } from 'react';
import { executeBlockAction } from '@/services/BlockActionHandlers';
import { GenericJSONCard } from './GenericJSONDisplay';
import { JSONOutputRenderer } from './JSONOutputRenderer';
import { UniversalBlockRenderer } from './UniversalBlockRenderer';

type EnhancedJSONOutputRendererProps = {
  // Common props
  jsonData: any;
  sessionId: string;
  user: any;
  onActionComplete?: (result: { message: string; data?: any }) => void;
  onProgress?: (update: string) => void;

  // Block-based rendering props
  blocks?: BlockInstance[];

  // Legacy schema-based rendering props
  onOpenImageModal?: (data: {
    prompt: string;
    style?: string;
    title?: string;
    description?: string;
    sourceQuote?: string;
  }) => void;
  onOpenVideoModal?: (data: {
    prompt: string;
    title?: string;
    duration?: number;
    referenceImagePrompt?: string;
    sourceQuote?: string;
  }) => void;
  onOpenMusicModal?: (data: {
    instrumentalOption?: any;
    lyricalOption?: any;
  }) => void;
};

/**
 * EnhancedJSONOutputRenderer
 *
 * Intelligently routes to the appropriate renderer:
 * 1. If blocks are provided → UniversalBlockRenderer
 * 2. If schemaType is present → Legacy JSONOutputRenderer
 * 3. Otherwise → GenericJSONDisplay fallback
 */
export function EnhancedJSONOutputRenderer({
  jsonData,
  sessionId,
  user,
  onActionComplete,
  onProgress,
  blocks,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenMusicModal,
}: EnhancedJSONOutputRendererProps) {
  const [actionStatus, setActionStatus] = useState<{
    isProcessing: boolean;
    message: string | null;
  }>({
    isProcessing: false,
    message: null,
  });

  /**
   * Handle block action execution
   */
  const handleActionExecute = useCallback(
    async (request: any) => {
      setActionStatus({ isProcessing: true, message: 'Processing...' });
      onProgress?.('Executing action...');

      try {
        const result = await executeBlockAction({
          ...request,
          user,
          sessionId,
          onProgress,
        });

        if (result.success) {
          const message = `✅ Action completed successfully`;
          setActionStatus({ isProcessing: false, message });
          onActionComplete?.({ message, data: result.data });
        } else {
          const message = `❌ ${result.error || 'Action failed'}`;
          setActionStatus({ isProcessing: false, message });
          onActionComplete?.({ message });
        }

        return result;
      } catch (error) {
        const message = `❌ ${error instanceof Error ? error.message : 'Unknown error'}`;
        setActionStatus({ isProcessing: false, message });
        onActionComplete?.({ message });

        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    [user, sessionId, onProgress, onActionComplete],
  );

  /**
   * Determine rendering strategy
   */
  const renderStrategy = (): 'blocks' | 'schema' | 'generic' => {
    // Strategy 1: Block-based rendering (new system)
    if (blocks && blocks.length > 0) {
      return 'blocks';
    }

    // Strategy 2: Schema-based rendering (legacy system)
    if (jsonData && typeof jsonData === 'object' && 'schemaType' in jsonData) {
      return 'schema';
    }

    // Strategy 3: Generic fallback
    return 'generic';
  };

  const strategy = renderStrategy();

  // RENDER: Block-based (new system)
  if (strategy === 'blocks') {
    return (
      <div className="space-y-3">
        <UniversalBlockRenderer
          blocks={blocks!}
          jsonOutput={jsonData}
          context={{ sessionId, patientId: jsonData?.patientId }}
          onActionExecute={handleActionExecute}
          sessionId={sessionId}
          user={user}
        />

        {/* Action status feedback */}
        {actionStatus.message && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              actionStatus.message.startsWith('✅')
                ? 'border-green-200 bg-green-50 text-green-800'
                : actionStatus.message.startsWith('❌')
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-blue-200 bg-blue-50 text-blue-800'
            }`}
          >
            {actionStatus.message}
          </div>
        )}
      </div>
    );
  }

  // RENDER: Schema-based (legacy system)
  if (strategy === 'schema') {
    return (
      <JSONOutputRenderer
        jsonData={jsonData as AnyJSONSchema & { schemaType: JSONSchemaType }}
        sessionId={sessionId}
        user={user}
        onActionComplete={(result) => {
          onActionComplete?.(result);
        }}
        onProgress={(update) => {
          onProgress?.(update);
        }}
        onOpenImageModal={onOpenImageModal}
        onOpenVideoModal={onOpenVideoModal}
        onOpenMusicModal={onOpenMusicModal}
      />
    );
  }

  // RENDER: Generic fallback
  return (
    <GenericJSONCard data={jsonData} title="AI Response" />
  );
}

/**
 * Backwards-compatible export
 * Allows existing code to use EnhancedJSONOutputRenderer with same API
 */
export { EnhancedJSONOutputRenderer as JSONOutputRendererV2 };
