'use client';

/**
 * Assistant Message Content Component
 * Renders markdown with syntax highlighting and custom styling
 */

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

type AssistantMessageContentProps = {
  content: string;
};

export function AssistantMessageContent({ content }: AssistantMessageContentProps) {
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
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-600">{language}</span>
                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm transition-all hover:bg-gray-100 hover:text-gray-900 group-hover/code:opacity-100"
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
                      fontFamily: "'Fira Code', 'Courier New', monospace",
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
                className="rounded border border-indigo-100 bg-indigo-50 px-1.5 py-0.5 font-mono text-[13px] text-indigo-700"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Custom heading styles
          h1: ({ node, ...props }: any) => <h1 className="mb-4 mt-6 text-xl font-bold text-gray-900" {...props} />,
          h2: ({ node, ...props }: any) => <h2 className="mb-3 mt-5 text-lg font-bold text-gray-900" {...props} />,
          h3: ({ node, ...props }: any) => <h3 className="mb-2 mt-4 text-base font-semibold text-gray-900" {...props} />,

          // Custom paragraph styles
          p: ({ node, ...props }: any) => <p className="mb-3 text-[15px] leading-relaxed text-gray-700" {...props} />,

          // Custom list styles
          ul: ({ node, ...props }: any) => <ul className="mb-3 ml-4 list-disc space-y-1.5 text-gray-700" {...props} />,
          ol: ({ node, ...props }: any) => <ol className="mb-3 ml-4 list-decimal space-y-1.5 text-gray-700" {...props} />,
          li: ({ node, ...props }: any) => <li className="text-[15px] leading-relaxed" {...props} />,

          // Custom link styles
          a: ({ node, ...props }: any) => (
            <a
              className="font-medium text-indigo-600 underline decoration-indigo-300 decoration-2 underline-offset-2 transition-colors hover:text-indigo-700 hover:decoration-indigo-500"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),

          // Custom blockquote styles
          blockquote: ({ node, ...props }: any) => (
            <blockquote className="my-4 border-l-4 border-indigo-500 bg-indigo-50 px-4 py-2 italic text-gray-700" {...props} />
          ),

          // Custom table styles
          table: ({ node, ...props }: any) => (
            <div className="my-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-lg border border-gray-200" {...props} />
            </div>
          ),
          thead: ({ node, ...props }: any) => <thead className="bg-gray-50" {...props} />,
          th: ({ node, ...props }: any) => (
            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-700" {...props} />
          ),
          td: ({ node, ...props }: any) => <td className="border-t border-gray-200 px-4 py-2 text-sm text-gray-700" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
