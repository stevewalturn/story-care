'use client';

/**
 * AI Assistant Panel Component
 * Handles AI chat interface, model selection, and message rendering with JSON output support
 */

import type { AIAssistantPanelProps } from '../types/transcript.types';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JSONOutputRenderer } from '@/components/sessions/JSONOutputRenderer';
import { getAvailableTextModels } from '@/libs/ModelMetadata';
import { authenticatedFetch, authenticatedPost } from '@/utils/AuthenticatedFetch';
import { detectAndExtractJSON } from '@/utils/JSONSchemaDetector';

export function AIAssistantPanel({
  sessionId,
  patientName,
  user,
  assignedModule,
  triggerPrompt,
  onPromptSent,
  onAssignModule,
  onTextSelection,
  onOpenImageModal,
  onOpenVideoModal,
  onOpenMusicModal,
  onLibraryRefresh,
}: AIAssistantPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [visibleMessageCount, setVisibleMessageCount] = useState(10); // Pagination state
  const [isLoading, setIsLoading] = useState(false);
  const [_isLoadingHistory, _setIsLoadingHistory] = useState(true);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        _setIsLoadingHistory(true);
        const response = await authenticatedFetch(`/api/sessions/${sessionId}/chat`, user);

        if (response.ok) {
          const data = await response.json();
          const loadedMessages = data.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
          }));
          setMessages(loadedMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        _setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [sessionId, user]);

  // Watch for trigger prompt from analyze modal
  useEffect(() => {
    if (triggerPrompt) {
      handleSendMessage(triggerPrompt);
      onPromptSent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerPrompt]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || prompt;
    if (!textToSend.trim() || isLoading) {
      return;
    }

    const userMessage = { role: 'user' as const, content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);

    try {
      const response = await authenticatedPost('/api/ai/chat', user, {
        messages: [...messages, userMessage],
        sessionId,
        model: selectedModel,
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExamplePrompt = (exampleText: string) => {
    handleSendMessage(exampleText);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Pagination: Load more messages
  const loadMoreMessages = () => {
    setVisibleMessageCount(prev => prev + 10);
  };

  // Calculate visible messages (show last N messages)
  const visibleMessages = messages.slice(-visibleMessageCount);
  const hasMoreMessages = messages.length > visibleMessageCount;

  return (
    <>
      {/* Header */}
      <div className="border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">
              AI Assistant (
              {patientName}
              's Narrative)
            </h2>
            {/* Module Badge or Assign Button */}
            {assignedModule ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1">
                  <svg className="h-3.5 w-3.5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-medium text-indigo-900">{assignedModule.name}</span>
                </div>
                <button
                  onClick={onAssignModule}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-700"
                  title="Change Module"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={onAssignModule}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Assign Treatment Module
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([])}
              className="text-gray-500 hover:text-gray-700"
              title="Clear chat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Model Selector */}
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <label htmlFor="ai-model" className="text-sm font-medium text-gray-700">
              Model:
            </label>
            <select
              id="ai-model"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            >
              {Object.entries(getAvailableTextModels()).map(([provider, models]) => (
                <optgroup key={provider} label={provider}>
                  {models.map(model => (
                    <option key={model.value} value={model.value}>
                      {model.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Chat Messages or Empty State */}
      <div className="flex-1 overflow-y-auto p-4" onMouseUp={onTextSelection}>
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="max-w-md text-center">
              {/* Chat Icon */}
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-blue-50">
                <svg className="h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>

              <h3 className="mb-2 text-lg font-semibold text-gray-900">Therapeutic Chat Assistant</h3>
              <p className="mb-4 text-sm text-gray-500">
                Ask questions about this session, request insights, or describe what you'd like to visualize.
              </p>

              {/* No Module Assigned Notice */}
              {!assignedModule && (
                <div className="mb-6 rounded-lg border-2 border-dashed border-indigo-300 bg-indigo-50 p-4">
                  <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 flex-shrink-0 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1 text-left">
                      <h4 className="mb-1 text-sm font-semibold text-indigo-900">No Treatment Module Assigned</h4>
                      <p className="mb-3 text-xs text-indigo-700">
                        Assign a treatment module to unlock specialized prompts and therapeutic workflows tailored to this patient's needs.
                      </p>
                      <button
                        onClick={onAssignModule}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Assign Module Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Example Prompts */}
              <div className="mb-6 space-y-3 text-left">
                <div className="mb-2 text-xs font-medium text-gray-700">For Analysis:</div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExamplePrompt('What are the key themes in this session?')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "What are the key themes in this session?"
                  </button>
                  <button
                    onClick={() => handleExamplePrompt('How is the patient progressing?')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "How is the patient progressing?"
                  </button>
                </div>

                <div className="mt-4 mb-2 text-xs font-medium text-gray-700">For Media:</div>
                <div className="space-y-2">
                  <button
                    onClick={() => handleExamplePrompt('Create an image showing the patient\'s main metaphor')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "Create an image showing the patient's main metaphor"
                  </button>
                  <button
                    onClick={() => handleExamplePrompt('Visualize the patient\'s journey from problem to solution')}
                    className="w-full rounded p-2 text-left text-xs text-gray-600 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  >
                    "Visualize the patient's journey from problem to solution"
                  </button>
                </div>
              </div>

              {/* Prompt Selector */}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2">
                  <svg className="h-4 w-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">Choose a favorite prompt...</span>
                  <svg className="ml-auto h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Load More Button */}
            {hasMoreMessages && (
              <div className="flex items-center justify-center pb-4">
                <button
                  onClick={loadMoreMessages}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  Load More Previous Messages
                  <span className="ml-1 text-xs text-gray-500">
                    (Showing
                    {' '}
                    {visibleMessages.length}
                    {' '}
                    of
                    {' '}
                    {messages.length}
                    )
                  </span>
                </button>
              </div>
            )}

            {visibleMessages.map((message, index) => {
              // Detect JSON in assistant messages
              const jsonData = message.role === 'assistant' ? detectAndExtractJSON(message.content) : null;

              return (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                      <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] ${message.role === 'user' ? 'rounded-lg bg-indigo-600 px-4 py-3 text-white' : ''}`}
                  >
                    {message.role === 'assistant' ? (
                      jsonData ? (
                        // Render JSON output with action buttons
                        <JSONOutputRenderer
                          jsonData={jsonData}
                          sessionId={sessionId}
                          user={user}
                          onActionComplete={(result) => {
                            // Refresh the library panel to show newly saved items
                            if (onLibraryRefresh) {
                              onLibraryRefresh();
                            }
                            console.log('Action completed:', result.message);
                          }}
                          onProgress={(update) => {
                            // Just log progress, don't clutter chat
                            console.log('Progress update:', update);
                          }}
                          onOpenImageModal={onOpenImageModal}
                          onOpenVideoModal={onOpenVideoModal}
                          onOpenMusicModal={onOpenMusicModal}
                        />
                      ) : (
                        // Regular markdown rendering for non-JSON content
                        <div className="rounded-lg bg-gray-100 px-4 py-3 text-gray-900">
                          <div className="prose prose-sm max-w-none text-sm leading-relaxed
                            prose-headings:font-semibold prose-headings:text-gray-900
                            prose-h1:mt-4 prose-h1:mb-3 prose-h1:text-lg
                            prose-h2:mt-4 prose-h2:mb-2 prose-h2:text-base
                            prose-h3:mt-3 prose-h3:mb-2 prose-h3:text-sm
                            prose-p:my-2 prose-p:text-gray-700
                            prose-a:text-indigo-600 prose-a:no-underline
                            hover:prose-a:underline prose-blockquote:rounded-r
                            prose-blockquote:border-l-4 prose-blockquote:border-indigo-500
                            prose-blockquote:bg-indigo-50 prose-blockquote:px-4
                            prose-blockquote:py-2 prose-blockquote:text-gray-700
                            prose-blockquote:not-italic prose-strong:font-semibold
                            prose-strong:text-gray-900 prose-code:rounded
                            prose-code:bg-indigo-50 prose-code:px-1
                            prose-code:py-0.5 prose-code:font-mono prose-code:text-xs
                            prose-code:text-indigo-600 prose-ol:my-2
                            prose-ul:my-2 prose-li:my-1 prose-li:text-gray-700"
                          >
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                      <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="rounded-lg bg-gray-100 px-4 py-3">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            {/* Auto-scroll anchor */}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="relative">
          <input
            type="text"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Chat about this transcript, or select text to begin..."
            className="w-full rounded-lg border border-gray-200 py-3 pr-12 pl-4 text-sm focus:border-indigo-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !prompt.trim()}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-gray-400"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
