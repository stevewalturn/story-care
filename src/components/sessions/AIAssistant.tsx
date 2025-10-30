'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2, X, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIAssistantProps {
  sessionId: string;
  contextText?: string;
  initialPrompt?: string;
  onClose: () => void;
}

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
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // In real implementation, call OpenAI API
      // const response = await fetch('/api/ai/chat', {
      //   method: 'POST',
      //   body: JSON.stringify({
      //     sessionId,
      //     messages: [...messages, userMessage],
      //     context: contextText,
      //   }),
      // });

      // Mock response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateMockResponse(messageText),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI request failed:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, messageId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateMockResponse = (userInput: string) => {
    if (userInput.toLowerCase().includes('analyze')) {
      return 'This passage reveals several key therapeutic themes:\n\n1. **Emotional Processing**: The client is expressing vulnerability and working through difficult emotions.\n\n2. **Narrative Reconstruction**: There are signs of the client beginning to reframe their story in a more empowering way.\n\n3. **Therapeutic Alliance**: The interaction shows strong rapport and trust between therapist and client.\n\nWould you like me to explore any of these themes further?';
    }

    if (userInput.toLowerCase().includes('quote')) {
      return 'I\'ve identified this powerful quote that could be used in the patient\'s story:\n\n"[Extract from selected text]"\n\nThis quote demonstrates resilience and growth. Would you like me to suggest how to incorporate it into a story page?';
    }

    if (userInput.toLowerCase().includes('image')) {
      return 'Based on this passage, I recommend generating an image that captures:\n\n**Visual Theme**: [Theme from text]\n**Mood**: [Mood description]\n**Suggested Prompt**: "[AI image generation prompt]"\n\nWould you like me to refine this prompt or generate the image?';
    }

    return 'I\'ve analyzed the selected text. Here are my insights:\n\n- This passage contains important emotional content\n- It could be valuable for the patient\'s therapeutic narrative\n- Consider using it as a foundation for reflection questions\n\nHow would you like to proceed?';
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <Button variant="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.role === 'system') {
            return (
              <div
                key={message.id}
                className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
              >
                <p className="text-blue-900 font-medium mb-1">Context:</p>
                <p className="text-blue-800 italic whitespace-pre-wrap">
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
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.id)}
                      className="text-xs"
                    >
                      {copiedId === message.id ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
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
            <div className="bg-gray-100 rounded-lg p-3">
              <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs font-medium text-gray-700 mb-2">Quick Actions:</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSend('Analyze the key themes in this passage')}
            className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Analyze themes
          </button>
          <button
            onClick={() => handleSend('Extract a meaningful quote')}
            className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Extract quote
          </button>
          <button
            onClick={() => handleSend('Suggest an image generation prompt')}
            className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Generate image idea
          </button>
        </div>
      </div>
    </div>
  );
}
