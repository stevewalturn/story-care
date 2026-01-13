'use client';

type HTMLContentProps = {
  html: string;
  className?: string;
};

/**
 * Prose modifier classes that match AssistantMessageContent styling
 * This ensures notes display with the same formatting as chat messages
 */
const proseModifiers = [
  // Headings
  'prose-headings:font-bold',
  'prose-h1:mt-6 prose-h1:mb-4 prose-h1:text-xl prose-h1:text-gray-900',
  'prose-h2:mt-5 prose-h2:mb-3 prose-h2:text-lg prose-h2:text-gray-900',
  'prose-h3:mt-4 prose-h3:mb-2 prose-h3:text-base prose-h3:font-semibold prose-h3:text-gray-900',
  // Paragraphs
  'prose-p:mb-3 prose-p:text-[15px] prose-p:leading-relaxed prose-p:text-gray-700',
  // Lists
  'prose-ul:mb-3 prose-ul:ml-4 prose-ul:list-disc prose-ul:text-gray-700',
  'prose-ol:mb-3 prose-ol:ml-4 prose-ol:list-decimal prose-ol:text-gray-700',
  'prose-li:text-[15px] prose-li:leading-relaxed',
  // Links
  'prose-a:font-medium prose-a:text-purple-600 prose-a:underline prose-a:decoration-purple-300 prose-a:decoration-2 prose-a:underline-offset-2 hover:prose-a:text-purple-700',
  // Blockquotes
  'prose-blockquote:my-4 prose-blockquote:border-l-4 prose-blockquote:border-purple-500 prose-blockquote:bg-purple-50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:text-gray-700 prose-blockquote:italic prose-blockquote:not-italic',
  // Inline code
  'prose-code:rounded prose-code:border prose-code:border-purple-100 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:font-mono prose-code:text-[13px] prose-code:text-purple-700 prose-code:before:content-none prose-code:after:content-none',
  // Code blocks
  'prose-pre:my-4 prose-pre:rounded-xl prose-pre:border prose-pre:border-gray-200 prose-pre:bg-gray-900',
  // Tables
  'prose-table:my-4 prose-table:min-w-full prose-table:divide-y prose-table:divide-gray-200 prose-table:rounded-lg prose-table:border prose-table:border-gray-200',
  'prose-thead:bg-gray-50',
  'prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:uppercase prose-th:tracking-wider prose-th:text-gray-700',
  'prose-td:border-t prose-td:border-gray-200 prose-td:px-4 prose-td:py-2 prose-td:text-sm prose-td:text-gray-700',
  // Strong/Bold
  'prose-strong:font-semibold prose-strong:text-gray-900',
].join(' ');

/**
 * Safely renders HTML content with rich prose styling
 * Used for displaying notes and other rich text content
 * Styling matches AssistantMessageContent for consistency with chat messages
 */
export function HTMLContent({ html, className = '' }: HTMLContentProps) {
  return (
    <div
      className={`prose prose-sm max-w-none ${proseModifiers} ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
