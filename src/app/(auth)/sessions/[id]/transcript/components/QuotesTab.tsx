'use client';

/**
 * Quotes Tab Component
 * Displays extracted quotes from session transcript
 */

import type { QuotesTabProps } from '../types/transcript.types';
import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';

export function QuotesTab({ sessionId, user, refreshKey, selectedPatient, onEditQuote, onDeleteQuote, onJumpToTimestamp }: QuotesTabProps) {
  const [quotes, setQuotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [sessionPatients, setSessionPatients] = useState<any[]>([]);

  // Load quotes for this session (refreshes when refreshKey changes)
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user || !sessionId) return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          sessionId,
        });

        // Filter by patient if selected
        if (selectedPatient && selectedPatient !== 'all') {
          params.append('patientId', selectedPatient);
        }

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
  }, [sessionId, user, refreshKey, selectedPatient]);

  // Fetch session patients for Save Quote modal
  useEffect(() => {
    const fetchSessionPatients = async () => {
      if (!user || !sessionId) return;

      try {
        const response = await authenticatedFetch(`/api/sessions/${sessionId}`, user);
        if (response.ok) {
          const data = await response.json();
          const session = data.session;
          const patients: any[] = [];

          // Handle individual session
          if (session.patient) {
            patients.push({
              id: session.patient.id,
              name: session.patient.name,
              avatarUrl: session.patient.avatarUrl || null,
            });
          }

          // Handle group session
          if (session.group?.members) {
            for (const member of session.group.members) {
              if (!patients.find(p => p.id === member.id)) {
                patients.push({
                  id: member.id,
                  name: member.name,
                  avatarUrl: member.avatarUrl || null,
                });
              }
            }
          }

          setSessionPatients(patients);
        }
      } catch (error) {
        console.error('Error fetching session patients:', error);
      }
    };

    fetchSessionPatients();
  }, [sessionId, user]);

  // Handler for creating new quote
  const handleCreateQuote = async (quoteData: {
    patientId: string;
    quoteText: string;
    speaker: string;
  }) => {
    try {
      const response = await authenticatedPost('/api/quotes', user, {
        ...quoteData,
        sessionId,
      });

      if (!response.ok) {
        throw new Error('Failed to create quote');
      }

      // Refresh quotes list
      const params = new URLSearchParams({ sessionId });
      if (selectedPatient && selectedPatient !== 'all') {
        params.append('patientId', selectedPatient);
      }
      const quotesResponse = await authenticatedFetch(`/api/quotes?${params.toString()}`, user);
      if (quotesResponse.ok) {
        const data = await quotesResponse.json();
        setQuotes(data.quotes || []);
      }

      setShowNewQuoteModal(false);
    } catch (error) {
      console.error('Error creating quote:', error);
      throw error;
    }
  };

  return (
    <>
      {/* Quotes Header with New Quote Button */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Quotes (
            {quotes.length}
            )
          </h3>
          <button
            onClick={() => setShowNewQuoteModal(true)}
            className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-purple-700"
          >
            <Plus className="h-4 w-4" />
            New Quote
          </button>
        </div>
      </div>

      {/* Quotes List */}
      <div className="flex-1 overflow-y-auto bg-white p-4">
        {isLoading ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading quotes...</p>
          </div>
        ) : quotes.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-sm text-gray-700">No quotes extracted yet</p>
            <p className="mt-1 text-xs text-gray-500">Select text from the transcript to create quotes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quotes.map(quote => (
              <div
                key={quote.id}
                className="rounded-lg border border-gray-200 p-4 transition-all hover:border-purple-300 hover:shadow-sm"
              >
                {/* Header */}
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {quote.speakerName || quote.speakerLabel || quote.speakerType || 'Unknown'}
                    </span>
                    {quote.startTimeSeconds && (
                      <>
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
                        {onJumpToTimestamp && (
                          <button
                            onClick={() => onJumpToTimestamp(Number(quote.startTimeSeconds))}
                            className="flex items-center gap-1 rounded-md bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-200"
                            title="Play this quote in the transcript"
                          >
                            <Play className="h-3 w-3" />
                            Play in transcript
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {onEditQuote && (
                      <button
                        onClick={() => onEditQuote(quote)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-purple-50 hover:text-purple-600"
                        title="Edit quote"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {onDeleteQuote && (
                      <button
                        onClick={() => onDeleteQuote(quote)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        title="Delete quote"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
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
                        className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700"
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

      {/* New Quote Modal */}
      {showNewQuoteModal && (
        <SaveQuoteModal
          isOpen={showNewQuoteModal}
          onClose={() => setShowNewQuoteModal(false)}
          selectedText=""
          patients={sessionPatients}
          onSave={handleCreateQuote}
        />
      )}
    </>
  );
}
