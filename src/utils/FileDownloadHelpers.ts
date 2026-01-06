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
