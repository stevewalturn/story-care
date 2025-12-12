'use client';

/**
 * AI Assistant Panel Component
 * Handles AI chat interface, model selection, and message rendering with JSON output support
 */

import type { AIAssistantPanelProps } from '../types/transcript.types';
import { useEffect, useRef, useState } from 'react';
import { AssistantMessageContent } from '@/components/sessions/AssistantMessageContent';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Textarea handlers for auto-resize and keyboard shortcuts
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = '52px'; // Reset to min height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
                  className={`group relative ${message.role === 'user' ? 'ml-12' : 'mr-12'}`}
                >
                  {/* Message Content */}
                  <div
                    className={`relative ${message.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}
                  >
                    {/* User/Assistant Label */}
                    <div className="mb-1.5 flex items-center gap-2 px-1">
                      {message.role === 'assistant' ? (
                        <>
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-semibold text-gray-900">AI Assistant</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xs font-semibold text-gray-700">You</span>
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gray-200">
                            <svg className="h-3.5 w-3.5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Message Bubble/Card */}
                    <div
                      className={`relative ${
                        message.role === 'user'
                          ? 'rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-indigo-700 px-4 py-3 text-white shadow-lg shadow-indigo-600/20'
                          : jsonData
                            ? 'w-full'
                            : 'rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 text-gray-900 shadow-sm'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        jsonData ? (
                          <JSONOutputRenderer
                            jsonData={jsonData}
                            sessionId={sessionId}
                            user={user}
                            onActionComplete={(result) => {
                              if (onLibraryRefresh) {
                                onLibraryRefresh();
                              }
                              console.log('Action completed:', result.message);
                            }}
                            onProgress={(update) => {
                              console.log('Progress update:', update);
                            }}
                            onOpenImageModal={onOpenImageModal}
                            onOpenVideoModal={onOpenVideoModal}
                            onOpenMusicModal={onOpenMusicModal}
                          />
                        ) : (
                          <AssistantMessageContent content={message.content} />
                        )
                      ) : (
                        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</p>
                      )}
                    </div>

                    {/* Action Buttons (Assistant messages only) */}
                    {message.role === 'assistant' && !jsonData && (
                      <div className="mt-2 flex items-center gap-1 px-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                          title="Copy message"
                          onClick={() => navigator.clipboard.writeText(message.content)}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="mr-12">
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-600">
                    <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">AI Assistant</span>
                  <span className="text-xs text-gray-500">is thinking...</span>
                </div>

                <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {/* Animated dots */}
                    <div className="flex gap-1.5">
                      <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-500" style={{ animationDelay: '0ms' }} />
                      <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-indigo-300" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-gray-500">Analyzing and generating response...</span>
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
          {/* Textarea for multi-line support */}
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder="Message AI Assistant..."
            className="w-full resize-none rounded-xl border-2 border-gray-200 bg-gray-50 py-3.5 pr-24 pl-4 text-[15px] leading-relaxed transition-all placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/10"
            disabled={isLoading}
            style={{
              minHeight: '52px',
              maxHeight: '200px',
            }}
          />

          {/* Action buttons */}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {/* Send button */}
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !prompt.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl hover:shadow-indigo-600/40 disabled:cursor-not-allowed disabled:from-gray-300 disabled:to-gray-400 disabled:shadow-none"
              title={prompt.trim() ? 'Send message (Enter)' : 'Type a message'}
            >
              {isLoading ? (
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>

          {/* Keyboard hint */}
          <div className="absolute -bottom-6 right-0 flex items-center gap-1 text-xs text-gray-400">
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Enter</kbd>
            <span>to send</span>
            <span className="mx-1">•</span>
            <kbd className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">Shift + Enter</kbd>
            <span>for new line</span>
          </div>
        </div>
      </div>
    </>
  );
}
