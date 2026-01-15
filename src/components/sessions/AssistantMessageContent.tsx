'use client';

/**
 * Assistant Message Content Component
 * Renders markdown with syntax highlighting and custom styling
 * Includes clickable timestamp detection for quote navigation
 */

import { Play } from 'lucide-react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

type AssistantMessageContentProps = {
  content: string;
  onJumpToTimestamp?: (timestamp: number) => void;
};

/**
 * Parses a timestamp string like "20:45" or "1:23:45" to seconds
 */
function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Detects timestamp patterns in text and makes them clickable
 * Supports formats: [20:45], [1:23], [1:23:45]
 */
function renderTextWithTimestamps(
  text: string,
  onJumpToTimestamp?: (timestamp: number) => void,
): ReactNode {
  if (!onJumpToTimestamp || !text) {
    return text;
  }

  // Pattern to match timestamps like [20:45], [1:23], [01:23:45]
  const timestampPattern = /\[(\d{1,2}:\d{2}(?::\d{2})?)\]/g;

  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let keyCounter = 0;

  while ((match = timestampPattern.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(<span key={`text-${keyCounter++}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    // Add clickable timestamp button
    const timestamp = match[1];
    const seconds = parseTimestampToSeconds(timestamp);

    parts.push(
      <button
        key={`ts-${keyCounter++}-${timestamp}`}
        type="button"
        onClick={() => onJumpToTimestamp(seconds)}
        className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-200"
        title={`Jump to ${timestamp} in transcript`}
      >
        <Play className="h-3 w-3" />
        {timestamp}
      </button>,
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`text-${keyCounter++}`}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

/**
 * Recursively processes React children to find and transform timestamp patterns
 */
function processChildren(
  children: ReactNode,
  onJumpToTimestamp?: (timestamp: number) => void,
): ReactNode {
  if (!onJumpToTimestamp) {
    return children;
  }

  if (typeof children === 'string') {
    return renderTextWithTimestamps(children, onJumpToTimestamp);
  }

  if (Array.isArray(children)) {
    return children.map((child, index) => {
      if (typeof child === 'string') {
        return <span key={index}>{renderTextWithTimestamps(child, onJumpToTimestamp)}</span>;
      }
      return child;
    });
  }

  return children;
}

export function AssistantMessageContent({ content, onJumpToTimestamp }: AssistantMessageContentProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Syntax-highlighted code blocks
          code({ node, inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            return !inline && language ? (
              <div className="group/code relative my-4 overflow-hidden rounded-xl border border-gray-200">
                {/* Language badge */}
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <span className="text-xs font-medium tracking-wide text-gray-600 uppercase">{language}</span>
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm transition-all group-hover/code:opacity-100 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy
                  </button>
                </div>
                {/* Syntax highlighted code */}
                <SyntaxHighlighter
                  language={language}
                  style={oneDark}
                  customStyle={{
                    margin: 0,
                    borderRadius: 0,
                    background: '#1e1e1e',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: '\'Fira Code\', \'Courier New\', monospace',
                    },
                  }}
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              // Inline code
              <code
                className="rounded border border-purple-100 bg-purple-50 px-1.5 py-0.5 font-mono text-[13px] text-purple-700"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Custom heading styles
          h1: ({ node, ...props }: any) => <h1 className="mt-6 mb-4 text-xl font-bold text-gray-900" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="mt-5 mb-3 text-lg font-bold text-gray-900" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="mt-4 mb-2 text-base font-semibold text-gray-900" {...props} />,

          // Custom paragraph styles with timestamp detection
          p: ({ node, children, ...props }: any) => (
            <p className="mb-3 text-[15px] leading-relaxed text-gray-700" {...props}>
              {processChildren(children, onJumpToTimestamp)}
            </p>
          ),

          // Custom list styles with timestamp detection
          ul: ({ node, ...props }: any) => <ul className="mb-3 ml-4 list-disc space-y-1.5 text-gray-700" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-gray-700" {...props} />,
          li: ({ node, children, ...props }: any) => (
            <li className="text-[15px] leading-relaxed" {...props}>
              {processChildren(children, onJumpToTimestamp)}
            </li>
          ),

          // Custom strong (bold) text with timestamp detection
          strong: ({ node, children, ...props }: any) => (
            <strong {...props}>
              {processChildren(children, onJumpToTimestamp)}
            </strong>
          ),

          // Custom emphasis (italic) text with timestamp detection
          em: ({ node, children, ...props }: any) => (
            <em {...props}>
              {processChildren(children, onJumpToTimestamp)}
            </em>
          ),

          // Custom link styles
          a: ({ node, ...props }: any) => (
            <a
              className="font-medium text-purple-600 underline decoration-purple-300 decoration-2 underline-offset-2 transition-colors hover:text-purple-700 hover:decoration-purple-500"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Custom blockquote styles
          blockquote: ({ node, ...props }: any) => (
            <blockquote className="my-4 border-l-4 border-purple-500 bg-purple-50 px-4 py-2 text-gray-700 italic" {...props} />
          ),

          // Custom table styles
          table: ({ node, ...props }: any) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200" {...props} />
            </div>
          ),
          thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
          th: ({ node, ...props }: any) => (
            <th className="px-4 py-2 text-left text-xs font-semibold tracking-wider text-gray-700 uppercase" {...props} />
          ),
          td: ({ node, ...props }: any) => <td className="border-t border-gray-200 px-4 py-2 text-sm text-gray-700" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
