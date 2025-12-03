-- Add 'quote' and 'scene' to block_type enum
ALTER TYPE "block_type" ADD VALUE IF NOT EXISTS 'quote';
ALTER TYPE "block_type" ADD VALUE IF NOT EXISTS 'scene';
