'use client';

import { TipTapEditor } from '@/components/ui/TipTapEditor';
import { markdownToHTML } from '@/utils/MarkdownToHTML';

type PageBlockEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
};

/**
 * Checks if content appears to be HTML rather than Markdown
 */
function isLikelyHTML(content: string): boolean {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed.startsWith('<') || /<[a-z][\s\S]*>/i.test(trimmed);
}

/**
 * Converts content to HTML if it's Markdown, otherwise returns as-is
 */
function convertToHTML(content: string): string {
  if (!content) return '';
  return isLikelyHTML(content) ? content : markdownToHTML(content);
}

/**
 * Wrapper component for TipTap editor that handles Markdown-to-HTML auto-conversion.
 * Used in PageEditor for text and quote blocks.
 *
 * - Automatically detects and converts legacy Markdown content to HTML on load
 * - Stores content as HTML going forward
 * - Provides a seamless WYSIWYG editing experience
 */
export function PageBlockEditor({
  content,
  onChange,
  placeholder = 'Enter content...',
  className = '',
}: PageBlockEditorProps) {
  // Convert content to HTML (auto-detect Markdown vs HTML)
  // TipTapEditor handles content updates internally via useEffect
  const htmlContent = convertToHTML(content);

  return (
    <TipTapEditor
      content={htmlContent}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
