/**
 * useBuildingBlocks Hook
 *
 * Custom React hook for managing building block instances in prompt creation
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  BlockInstance,
  BlockType,
  ValidationResult,
} from '@/types/BuildingBlocks';
import {
  generateJSONSchema,
  validateBlocks,
} from '@/utils/BlockSchemaGenerator';

/**
 * Generate a unique instance ID
 */
function generateInstanceId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Custom hook for managing building blocks
 */
export function useBuildingBlocks(initialBlocks: BlockInstance[] = []) {
  const [blocks, setBlocks] = useState<BlockInstance[]>(initialBlocks);

  /**
   * Add a new block of specified type
   */
  const addBlock = useCallback(
    (blockType: BlockType, position?: number) => {
      const newBlock: BlockInstance = {
        blockId: blockType,
        instanceId: generateInstanceId(),
        values: {},
        order: position !== undefined ? position : blocks.length,
      };

      if (position !== undefined) {
        // Insert at specific position and reorder
        const newBlocks = [...blocks];
        newBlocks.splice(position, 0, newBlock);
        setBlocks(newBlocks.map((b, idx) => ({ ...b, order: idx })));
      } else {
        // Add at end
        setBlocks([...blocks, newBlock]);
      }

      return newBlock.instanceId;
    },
    [blocks],
  );

  /**
   * Remove a block by instance ID
   */
  const removeBlock = useCallback(
    (instanceId: string) => {
      const newBlocks = blocks
        .filter(b => b.instanceId !== instanceId)
        .map((b, idx) => ({ ...b, order: idx }));
      setBlocks(newBlocks);
    },
    [blocks],
  );

  /**
   * Update block values and optionally custom labels
   */
  const updateBlock = useCallback(
    (instanceId: string, values: Record<string, any>, customLabels?: Record<string, string>) => {
      setBlocks(
        blocks.map(b =>
          b.instanceId === instanceId
            ? {
                ...b,
                values: { ...b.values, ...values },
                ...(customLabels !== undefined && { customLabels }),
              }
            : b,
        ),
      );
    },
    [blocks],
  );

  /**
   * Replace block values entirely
   */
  const setBlockValues = useCallback(
    (instanceId: string, values: Record<string, any>) => {
      setBlocks(
        blocks.map(b =>
          b.instanceId === instanceId ? { ...b, values } : b,
        ),
      );
    },
    [blocks],
  );

  /**
   * Duplicate a block
   */
  const duplicateBlock = useCallback(
    (instanceId: string) => {
      const blockToDuplicate = blocks.find(b => b.instanceId === instanceId);
      if (!blockToDuplicate) return null;

      const duplicatedBlock: BlockInstance = {
        ...blockToDuplicate,
        instanceId: generateInstanceId(),
        order: blockToDuplicate.order + 1,
        values: { ...blockToDuplicate.values }, // Deep copy values
        customLabels: blockToDuplicate.customLabels ? { ...blockToDuplicate.customLabels } : undefined,
      };

      // Insert after original
      const newBlocks = [...blocks];
      const insertIndex = blocks.findIndex(b => b.instanceId === instanceId) + 1;
      newBlocks.splice(insertIndex, 0, duplicatedBlock);

      // Reorder
      setBlocks(newBlocks.map((b, idx) => ({ ...b, order: idx })));

      return duplicatedBlock.instanceId;
    },
    [blocks],
  );

  /**
   * Reorder blocks by dragging
   */
  const reorderBlocks = useCallback(
    (startIndex: number, endIndex: number) => {
      const result = Array.from(blocks);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);

      // Update order property
      const reordered = result.map((b, idx) => ({ ...b, order: idx }));
      setBlocks(reordered);
    },
    [blocks],
  );

  /**
   * Move block up in order
   */
  const moveBlockUp = useCallback(
    (instanceId: string) => {
      const index = blocks.findIndex(b => b.instanceId === instanceId);
      if (index > 0) {
        reorderBlocks(index, index - 1);
      }
    },
    [blocks, reorderBlocks],
  );

  /**
   * Move block down in order
   */
  const moveBlockDown = useCallback(
    (instanceId: string) => {
      const index = blocks.findIndex(b => b.instanceId === instanceId);
      if (index < blocks.length - 1 && index !== -1) {
        reorderBlocks(index, index + 1);
      }
    },
    [blocks, reorderBlocks],
  );

  /**
   * Clear all blocks
   */
  const clearBlocks = useCallback(() => {
    setBlocks([]);
  }, []);

  /**
   * Replace all blocks
   */
  const setAllBlocks = useCallback((newBlocks: BlockInstance[]) => {
    setBlocks(newBlocks.map((b, idx) => ({ ...b, order: idx })));
  }, []);

  /**
   * Get block by instance ID
   */
  const getBlock = useCallback(
    (instanceId: string): BlockInstance | undefined => {
      return blocks.find(b => b.instanceId === instanceId);
    },
    [blocks],
  );

  /**
   * Get blocks by type
   */
  const getBlocksByType = useCallback(
    (blockType: BlockType): BlockInstance[] => {
      return blocks.filter(b => b.blockId === blockType);
    },
    [blocks],
  );

  /**
   * Generate JSON schema from current blocks
   */
  const generateSchema = useCallback((): object => {
    return generateJSONSchema(blocks);
  }, [blocks]);

  /**
   * Validate current blocks
   */
  const validate = useCallback((): ValidationResult => {
    return validateBlocks(blocks);
  }, [blocks]);

  /**
   * Check if blocks are valid (memoized)
   */
  const isValid = useMemo(() => {
    const result = validateBlocks(blocks);
    return result.valid;
  }, [blocks]);

  /**
   * Get validation errors (memoized)
   */
  const validationErrors = useMemo(() => {
    const result = validateBlocks(blocks);
    return result.errors;
  }, [blocks]);

  /**
   * Check if a block has errors
   */
  const hasBlockErrors = useCallback(
    (instanceId: string): boolean => {
      const result = validateBlocks(blocks);
      return result.errors.some(error => error.blockInstanceId === instanceId);
    },
    [blocks],
  );

  /**
   * Get errors for a specific block
   */
  const getBlockErrors = useCallback(
    (instanceId: string) => {
      const result = validateBlocks(blocks);
      return result.errors.filter(error => error.blockInstanceId === instanceId);
    },
    [blocks],
  );

  /**
   * Get block count
   */
  const blockCount = useMemo(() => blocks.length, [blocks]);

  /**
   * Get block count by type
   */
  const getBlockCountByType = useCallback(
    (blockType: BlockType): number => {
      return blocks.filter(b => b.blockId === blockType).length;
    },
    [blocks],
  );

  /**
   * Check if blocks have been modified from initial
   */
  const isDirty = useMemo(() => {
    return JSON.stringify(blocks) !== JSON.stringify(initialBlocks);
  }, [blocks, initialBlocks]);

  return {
    // State
    blocks,
    blockCount,
    isValid,
    validationErrors,
    isDirty,

    // Block operations
    addBlock,
    removeBlock,
    updateBlock,
    setBlockValues,
    duplicateBlock,
    clearBlocks,
    setAllBlocks,

    // Ordering
    reorderBlocks,
    moveBlockUp,
    moveBlockDown,

    // Queries
    getBlock,
    getBlocksByType,
    getBlockCountByType,

    // Validation
    validate,
    hasBlockErrors,
    getBlockErrors,

    // Schema generation
    generateSchema,
  };
}
