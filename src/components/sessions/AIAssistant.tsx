'use client';

import { Check, Copy, Loader2, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

type AIAssistantProps = {
  sessionId: string;
  contextText?: string;
  initialPrompt?: string;
  onClose: () => void;
};

export function AIAssistant({
  sessionId,
  contextText,
  initialPrompt,
  onClose,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with context if provided
    if (contextText) {
      const systemMessage: Message = {
        id: '0',
        role: 'system',
        content: `Selected text from transcript:\n\n"${contextText}"`,
        timestamp: new Date(),
      };
      setMessages([systemMessage]);
    }

    // Auto-send initial prompt if provided
    if (initialPrompt) {
      setInput(initialPrompt);
      handleSend(initialPrompt);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim() || isLoading) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call OpenAI API via our backend
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          messages: [...messages, userMessage],
          context: contextText,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <Button variant="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((message) => {
          if (message.role === 'system') {
            return (
              <div
                key={message.id}
                className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm"
              >
                <p className="mb-1 font-medium text-blue-900">Context:</p>
                <p className="whitespace-pre-wrap text-blue-800 italic">
                  {message.content}
                </p>
              </div>
            );
          }

          return (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && (
                  <div className="mt-2 flex items-center gap-2 border-t border-gray-200 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="text-xs"
                    >
                      {copiedId === message.id
                        ? (
                            <>
                              <Check className="mr-1 h-3 w-3" />
                              Copied
                            </>
                          )
                        : (
                            <>
                              <Copy className="mr-1 h-3 w-3" />
                              Copy
                            </>
                          )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-gray-100 p-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about this transcript..."
              disabled={isLoading}
            />
          </div>
          <Button
            variant="primary"
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <p className="mb-2 text-xs font-medium text-gray-700">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSend('Analyze the key themes in this passage')}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs transition-colors hover:bg-gray-50"
            disabled={isLoading}
          >
            Analyze themes
          </button>
          <button
            onClick={() => handleSend('Extract a meaningful quote')}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs transition-colors hover:bg-gray-50"
            disabled={isLoading}
          >
            Extract quote
          </button>
          <button
            onClick={() => handleSend('Suggest an image generation prompt')}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs transition-colors hover:bg-gray-50"
            disabled={isLoading}
          >
            Generate image idea
          </button>
        </div>
      </div>
    </div>
  );
}
