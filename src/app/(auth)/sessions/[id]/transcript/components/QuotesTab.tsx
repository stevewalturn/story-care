'use client';

/**
 * Quotes Tab Component
 * Displays extracted quotes from session transcript
 */

import type { QuotesTabProps } from '../types/transcript.types';
import { useEffect, useState } from 'react';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

export function QuotesTab({ sessionId, user }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load quotes for this session
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          sessionId,
        });

        const response = await authenticatedFetch(`/api/quotes?${params.toString()}`, user);

        if (response.ok) {
          const data = await response.json();
          setQuotes(data.quotes || []);
        }
      } catch (error) {
        console.error('Error loading quotes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuotes();
  }, [sessionId, user]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {isLoading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-gray-500">No quotes extracted yet</p>
          <p className="mt-1 text-xs text-gray-400">Select text from the transcript to create quotes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map(quote => (
            <div
              key={quote.id}
              className="rounded-lg border border-gray-200 p-4 transition-all hover:border-indigo-300 hover:shadow-sm"
            >
              {/* Header */}
              <div className="mb-2 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-700">
                    {quote.speakerName || quote.speakerType || 'Unknown'}
                  </span>
                  {quote.startTimeSeconds && (
                    <span className="text-xs text-gray-500">
                      {Math.floor(Number(quote.startTimeSeconds) / 60)}
                      :
                      {(Number(quote.startTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                      {' '}
                      -
                      {Math.floor(Number(quote.endTimeSeconds) / 60)}
                      :
                      {(Number(quote.endTimeSeconds) % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* TODO: Fix scoping issue with setEditingQuote/setDeletingQuote */}
                  {/* <button
                    onClick={() => setEditingQuote(quote)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                    title="Edit quote"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeletingQuote(quote)}
                    className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    title="Delete quote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button> */}
                </div>
              </div>

              {/* Quote Text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {quote.quoteText}
              </p>

              {/* Tags */}
              {quote.tags && quote.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {quote.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              {quote.notes && (
                <p className="mt-2 text-xs text-gray-500 italic">
                  Note:
                  {' '}
                  {quote.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
