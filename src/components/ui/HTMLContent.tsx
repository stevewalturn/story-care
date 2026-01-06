'use client';

type HTMLContentProps = {
  html: string;
  className?: string;
};

/**
 * Safely renders HTML content with TipTap prose styling
 * Used for displaying notes and other rich text content
 */
export function HTMLContent({ html, className = '' }: HTMLContentProps) {
  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
