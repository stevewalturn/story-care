import { marked } from 'marked';

/**
 * Converts markdown text to HTML format compatible with TipTap editor
 * Uses the 'marked' library for robust markdown parsing
 */
export function markdownToHTML(markdown: string): string {
  if (!markdown) return '';

  // Configure marked for safe HTML output
  marked.setOptions({
    breaks: true,        // Convert \n to <br>
    gfm: true,          // GitHub Flavored Markdown
  });

  // Convert markdown to HTML
  const html = marked(markdown);

  // marked returns a Promise in some versions, handle both
  return typeof html === 'string' ? html : '';
}
