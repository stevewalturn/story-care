'use client';

import { Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SaveQuoteModal } from '@/components/sessions/SaveQuoteModal';
import { useAuth } from '@/contexts/AuthContext';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

type QuotesTabProps = {
  patientId: string;
};

type Quote = {
  id: string;
  quoteText: string;
  speaker: string;
  startTimeSeconds?: number;
  endTimeSeconds?: number;
  tags?: string[];
  notes?: string;
  createdAt: string;
  sessionId?: string;
  sessionTitle?: string;
};

type PatientOption = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export function QuotesTab({ patientId }: QuotesTabProps) {
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [showEditQuoteModal, setShowEditQuoteModal] = useState(false);
  const [patient, setPatient] = useState<PatientOption | null>(null);

  // Load patient data
  useEffect(() => {
    const loadPatient = async () => {
      if (!user?.uid || !patientId) return;

      try {
        const response = await authenticatedFetch(`/api/patients/${patientId}`, user);
        if (response.ok) {
          const data = await response.json();
          setPatient({
            id: data.patient.id,
            name: data.patient.name,
            avatarUrl: data.patient.avatarUrl,
          });
        }
      } catch (error) {
        console.error('Error fetching patient:', error);
      }
    };

    loadPatient();
  }, [user, patientId]);

  // Load quotes for this patient
  useEffect(() => {
    const loadQuotes = async () => {
      if (!user || !patientId) return;

      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          patientId,
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
  }, [patientId, user]);

  // Handler for creating new quote
  const handleCreateQuote = async (quoteData: {
    patientId: string;
    quoteText: string;
    speaker: string;
    startTimeSeconds?: number;
    endTimeSeconds?: number;
  }) => {
    try {
      if (!patient) {
        throw new Error('Patient not found');
      }

      const response = await authenticatedFetch('/api/quotes', user, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...quoteData,
          patientId: patient.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quote');
      }

      // Refresh quotes list
      const params = new URLSearchParams({ patientId });
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

  // Handler for editing quote
  const handleEditQuote = async (quoteData: {
    patientId: string;
    quoteText: string;
    speaker: string;
    startTimeSeconds?: number;
    endTimeSeconds?: number;
  }) => {
    if (!editingQuote) return;

    try {
      const response = await authenticatedFetch(`/api/quotes/${editingQuote.id}`, user, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      // Refresh quotes list
      const params = new URLSearchParams({ patientId });
      const quotesResponse = await authenticatedFetch(`/api/quotes?${params.toString()}`, user);
      if (quotesResponse.ok) {
        const data = await quotesResponse.json();
        setQuotes(data.quotes || []);
      }

      setShowEditQuoteModal(false);
      setEditingQuote(null);
    } catch (error) {
      console.error('Error updating quote:', error);
      throw error;
    }
  };

  // Handler for deleting quote
  const handleDeleteQuote = async (quoteId: string) => {
    if (!confirm('Are you sure you want to delete this quote?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(`/api/quotes/${quoteId}`, user, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }

      // Refresh quotes list
      setQuotes(quotes.filter(quote => quote.id !== quoteId));
    } catch (error) {
      console.error('Error deleting quote:', error);
      alert('Failed to delete quote');
    }
  };

  // Format time for display
  const formatTime = (seconds?: number) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Quotes Header with New Quote Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Quotes (
            {quotes.length}
            )
          </h2>
          <p className="text-sm text-gray-500">Meaningful quotes from sessions with this patient</p>
        </div>
        <button
          onClick={() => setShowNewQuoteModal(true)}
          className="flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Quote
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="text-sm text-gray-500">Loading quotes...</p>
        </div>
      ) : quotes.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10m0 0V6a2 2 0 00-2-2H9a2 2 0 00-2 2v2m0 0v10a2 2 0 002 2h10a2 2 0 002-2V8M9 12h6m-6 4h6" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">No quotes for this patient yet</p>
          <p className="mt-1 text-xs text-gray-500">Click "New Quote" to create the first quote</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="rounded-lg border border-gray-200 bg-white p-4 transition-all hover:border-purple-500 hover:shadow-sm"
            >
              {/* Header with actions */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                    <svg className="h-3 w-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 5v8a7 7 0 1014 0V9.101l-4-2.885v7.437a3 3 0 11-2-2.83V5H8z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{quote.speaker}</span>
                      {quote.startTimeSeconds && (
                        <span className="text-xs text-gray-500">
                          @
                          {formatTime(quote.startTimeSeconds)}
                          {quote.endTimeSeconds && ` - ${formatTime(quote.endTimeSeconds)}`}
                        </span>
                      )}
                    </div>
                    {quote.sessionTitle && (
                      <p className="text-xs text-purple-600">From session: {quote.sessionTitle}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString() : ''}
                  </span>
                  {/* Edit button */}
                  <button
                    onClick={() => {
                      setEditingQuote(quote);
                      setShowEditQuoteModal(true);
                    }}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-purple-600"
                    title="Edit quote"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteQuote(quote.id)}
                    className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-red-600"
                    title="Delete quote"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Quote text */}
              <blockquote className="relative mb-3 border-l-4 border-purple-200 pl-4 text-sm italic text-gray-700">
                "{quote.quoteText}"
              </blockquote>

              {/* Notes if present */}
              {quote.notes && (
                <div className="mb-3 text-xs text-gray-600">
                  <strong>Notes:</strong>
                  {' '}
                  {quote.notes}
                </div>
              )}

              {/* Tags */}
              {quote.tags && quote.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
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
            </div>
          ))}
        </div>
      )}

      {/* New Quote Modal */}
      {showNewQuoteModal && patient && (
        <SaveQuoteModal
          isOpen={showNewQuoteModal}
          onClose={() => setShowNewQuoteModal(false)}
          selectedText=""
          patients={[patient]}
          onSave={handleCreateQuote}
        />
      )}

      {/* Edit Quote Modal */}
      {showEditQuoteModal && editingQuote && patient && (
        <SaveQuoteModal
          isOpen={showEditQuoteModal}
          onClose={() => {
            setShowEditQuoteModal(false);
            setEditingQuote(null);
          }}
          selectedText={editingQuote.quoteText}
          speakerName={editingQuote.speaker}
          startTimeSeconds={editingQuote.startTimeSeconds}
          endTimeSeconds={editingQuote.endTimeSeconds}
          patients={[patient]}
          onSave={handleEditQuote}
        />
      )}
    </>
  );
}