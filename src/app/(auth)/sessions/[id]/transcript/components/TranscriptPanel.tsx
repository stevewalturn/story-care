'use client';

/**
 * Transcript Panel Component
 * Displays session transcript with search, summary, and speaker diarization
 * Collapsible panel that defaults to shown
 */

import type { TranscriptPanelProps, Utterance } from '../types/transcript.types';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { authenticatedFetch } from '@/utils/AuthenticatedFetch';

export function TranscriptPanel({
  sessionId,
  sessionTitle,
  utterances,
  audioUrl,
  onTextSelection,
  user,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionSummary, setSessionSummary] = useState<string | null>(null);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // Default: shown

  // Load session summary on mount
  useEffect(() => {
    const loadSessionSummary = async () => {
      try {
        setSummaryLoading(true);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/summary`, user);

        if (response.ok) {
          const data = await response.json();
          setSessionSummary(data.summary);
        }
      } catch (error) {
        console.error('Error loading session summary:', error);
      } finally {
        setSummaryLoading(false);
      }
    };

    loadSessionSummary();
  }, [sessionId, user]);

  const filteredUtterances = searchQuery
    ? utterances.filter(u =>
        u.text.toLowerCase().includes(searchQuery.toLowerCase())
        || u.speakerName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : utterances;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Collapsed state - thin vertical bar
  if (!isExpanded) {
    return (
      <div className="flex h-full w-14 flex-col items-center justify-start border-r border-gray-200 bg-white shadow-sm transition-all duration-300">
        <button
          onClick={() => setIsExpanded(true)}
          className="group relative mt-4 flex w-full flex-col items-center gap-3 py-4 transition-all duration-200 hover:bg-gray-50"
          title="Expand Transcript"
        >
          {/* Icon with background */}
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 transition-all duration-200 group-hover:bg-indigo-100 group-hover:scale-110">
            <svg className="h-4 w-4 text-indigo-600 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* Vertical text with better spacing */}
          <div className="flex flex-col items-center gap-0.5">
            {['T', 'R', 'A', 'N', 'S', 'C', 'R', 'I', 'P', 'T'].map((letter, i) => (
              <span
                key={i}
                className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 transition-colors duration-200 group-hover:text-indigo-600"
              >
                {letter}
              </span>
            ))}
          </div>
        </button>
      </div>
    );
  }

  // Expanded state - full panel
  return (
    <div className="flex h-full w-80 flex-col bg-white border-r border-gray-200 transition-all duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => window.location.href = '/sessions'}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="flex-1 text-center text-sm font-semibold text-gray-900">{sessionTitle}</h2>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-500 hover:text-gray-700"
            title="Collapse Transcript"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Audio Player */}
        {audioUrl && (
          <div className="mb-4">
            <audio src={audioUrl} controls className="w-full" />
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <svg className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            className="w-full rounded-lg border border-gray-200 py-2 pr-4 pl-10 text-sm focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Session Summary */}
      {summaryLoading && (
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-xs font-medium text-indigo-900">Generating session insights...</span>
          </div>
        </div>
      )}
      {sessionSummary && (
        <div className="border-b border-indigo-100">
          <button
            onClick={() => setSummaryExpanded(!summaryExpanded)}
            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 text-left transition-all hover:from-indigo-100 hover:to-purple-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-xs font-semibold text-indigo-900">Session Insights</span>
              </div>
              <svg
                className={`h-4 w-4 text-indigo-600 transition-transform ${summaryExpanded ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>
          {summaryExpanded && (
            <div
              className="max-h-80 overflow-y-auto border-t border-indigo-100 bg-white px-4 py-3"
              onMouseUp={onTextSelection}
            >
              <div className="prose-xs prose max-w-none prose-headings:font-semibold prose-headings:text-gray-900 prose-h1:mb-2 prose-h1:text-sm prose-h2:mb-1.5 prose-h2:text-xs prose-h3:mt-2 prose-h3:mb-1 prose-h3:text-xs prose-p:text-xs prose-p:leading-relaxed prose-p:text-gray-700 prose-blockquote:my-2 prose-blockquote:border-l-4 prose-blockquote:border-purple-400 prose-blockquote:bg-purple-50 prose-blockquote:px-3 prose-blockquote:py-1.5 prose-blockquote:text-xs prose-strong:font-semibold prose-strong:text-gray-900 prose-code:rounded prose-code:bg-indigo-50 prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-code:text-indigo-600 prose-ol:text-xs prose-ol:text-gray-700 prose-ul:text-xs prose-ul:text-gray-700 prose-li:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {sessionSummary}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instruction Banner */}
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-2">
        <p className="flex items-center gap-2 text-xs text-gray-500">
          <span>💡</span>
          Select transcript text to analyze or extract quotes
        </p>
      </div>

      {/* Transcript Messages */}
      <div
        className="flex-1 space-y-4 overflow-y-auto p-4"
        onMouseUp={onTextSelection}
      >
        {filteredUtterances.map((utterance: Utterance) => (
          <div key={utterance.id} className="flex gap-3">
            {/* Avatar */}
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
              utterance.speakerType === 'therapist' ? 'bg-blue-100' : 'bg-green-100'
            }`}
            >
              <svg
                className={`h-4 w-4 ${
                  utterance.speakerType === 'therapist' ? 'text-blue-600' : 'text-green-600'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>

            {/* Message Content */}
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-gray-900">{utterance.speakerName}</span>
                <span className="text-xs text-gray-500">
                  {formatTime(utterance.startTime)}
                  {' '}
                  -
                  {formatTime(utterance.endTime)}
                </span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                {utterance.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Re-label Button */}
      <div className="border-t border-gray-200 p-4">
        <button
          onClick={() => window.location.href = `/sessions/${sessionId}/speakers`}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Re-label Speakers
        </button>
      </div>
    </div>
  );
}
