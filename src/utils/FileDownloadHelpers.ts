/**
 * File Download Helpers
 * Utilities for downloading clinical notes and messages as text files
 * HIPAA-compliant client-side file downloads
 */

/**
 * Download text content as a .txt file
 * Generates a filename with timestamp for clinical documentation
 *
 * @param content - Text content to download
 * @param filenamePrefix - Prefix for filename (default: "clinical-note")
 * @returns void
 */
export function downloadAsTextFile(
  content: string,
  filenamePrefix: string = 'clinical-note',
): void {
  // Create blob from text content
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

  // Generate filename with ISO date (YYYY-MM-DD)
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${filenamePrefix}-${timestamp}.txt`;

  // Create download link and trigger
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convert HTML (from TipTap editor) to well-formatted Markdown
 * Handles common TipTap output elements for clean copy/paste into Notion, docs, etc.
 *
 * @param html - HTML string from TipTap editor
 * @returns Markdown-formatted string
 */
export function htmlToMarkdown(html: string): string {
  return (
    html
      // Headings - must come before generic tag stripping
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      // Blockquotes
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '> $1\n\n')
      // Links
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      // Bold
      .replace(/<(strong|b)>(.*?)<\/\1>/gi, '**$2**')
      // Italic
      .replace(/<(em|i)>(.*?)<\/\1>/gi, '*$2*')
      // Inline code
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      // Ordered list items - add numbered prefix
      .replace(/<li>/gi, '- ')
      .replace(/<\/li>/gi, '\n')
      // Remove list wrappers
      .replace(/<\/?(ul|ol)[^>]*>/gi, '\n')
      // Line breaks
      .replace(/<br\s*\/?>/gi, '\n')
      // Paragraphs
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<p[^>]*>/gi, '')
      // Divs
      .replace(/<\/div>/gi, '\n')
      .replace(/<div[^>]*>/gi, '')
      // Strip any remaining HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode common HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, '\'')
      .replace(/&nbsp;/g, ' ')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}

/**
 * Strip markdown formatting from content for plain text download
 * Preserves clinical information while removing formatting
 *
 * @param content - Markdown formatted text
 * @returns Plain text without markdown formatting
 */
export function stripMarkdownForPlainText(content: string): string {
  return (
    content
      // Remove bold/italic markers
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      // Remove links but keep text
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      // Remove heading markers but keep text
      .replace(/^#{1,6}\s+/gm, '')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      // Remove blockquotes
      .replace(/^>\s+/gm, '')
      // Clean up extra whitespace
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );
}
