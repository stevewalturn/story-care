import { marked } from 'marked';

/**
 * DATA FORMAT CONVENTION FOR NOTES:
 * ================================
 *
 * This utility enforces a standardized data format across the application:
 *
 * 1. AI RESPONSES: Always return markdown format
 *    - Example: "# Title\n\n**Bold text** and *italic*"
 *    - JSON schemas with text fields should output markdown
 *
 * 2. DATABASE STORAGE: Always store as HTML
 *    - notes.content field stores HTML
 *    - Converted via markdownToHTML() before saving
 *
 * 3. TIP TAP EDITOR: Expects HTML input
 *    - When pre-filling editor, convert markdown → HTML first
 *    - When reading from editor, data is already HTML
 *
 * 4. DISPLAY: HTML is rendered directly in UI
 *    - No conversion needed for display
 *    - dangerouslySetInnerHTML or TipTap renders HTML
 *
 * FLOW:
 * AI (markdown) → markdownToHTML() → Database (HTML) → Display (HTML)
 */

/**
 * Converts markdown text to HTML format compatible with TipTap editor and database storage
 *
 * @param markdown - Markdown formatted text (from AI responses)
 * @returns HTML formatted text (for database storage and display)
 *
 * @example
 * ```typescript
 * // AI returns markdown
 * const aiResponse = "# Note\n\n**Important** observation";
 *
 * // Convert before saving to database
 * const htmlContent = markdownToHTML(aiResponse);
 * // Result: "<h1>Note</h1><p><strong>Important</strong> observation</p>"
 *
 * // Save to database
 * await db.insert(notes).values({ content: htmlContent });
 * ```
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';

  // Configure marked for safe HTML output
  marked.setOptions({
    breaks: true, // Convert \n to <br>
    gfm: true, // GitHub Flavored Markdown
  });

  // Convert markdown to HTML
  const html = marked(markdown);

  // marked returns a Promise in some versions, handle both
  return typeof html === 'string' ? html : '';
}
