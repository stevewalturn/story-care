/**
 * Patient Messages Page
 * Communicate with therapist
 */

'use client';

import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PatientMessagesPage() {
  const [message, setMessage] = useState('');

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement message sending
    setMessage('');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
        <p className="mt-2 text-gray-600">
          Communicate with your therapist
        </p>
      </div>

      {/* Messages Container */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center justify-center h-full">
            <MessageSquare className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Messaging system coming soon
            </p>
            <p className="mt-1 text-xs text-gray-400">
              You'll be able to communicate securely with your therapist
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Button
              variant="primary"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Messages are encrypted and HIPAA-compliant
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start">
          <MessageSquare className="mr-3 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Secure Messaging</p>
            <p className="mt-1">
              All messages between you and your therapist are encrypted and stored securely. Your therapist will typically respond within 24-48 hours during business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
