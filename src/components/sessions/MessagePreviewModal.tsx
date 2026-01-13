'use client';

import { Copy, Download, Eye } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { downloadAsTextFile, stripMarkdownForPlainText } from '@/utils/FileDownloadHelpers';
import { AssistantMessageContent } from './AssistantMessageContent';

type MessagePreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  timestamp?: Date;
  onDownload?: () => void; // Optional callback for audit logging
};

export function MessagePreviewModal({
  isOpen,
  onClose,
  content,
  timestamp,
  onDownload,
}: MessagePreviewModalProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
    catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = () => {
    const plainText = stripMarkdownForPlainText(content);
    downloadAsTextFile(plainText, 'clinical-note');

    // Trigger callback for audit logging if provided
    if (onDownload) {
      onDownload();
    }
  };

  const formattedDate = timestamp
    ? timestamp.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Message Preview"
      size="xl"
      hideFooter={false}
      footer={(
        <div className="flex w-full items-center justify-between">
          {/* Left side - timestamp */}
          <span className="text-sm text-gray-500">
            {formattedDate}
          </span>

          {/* Right side - action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-purple-500 hover:bg-purple-50 hover:text-purple-700"
            >
              <Copy className="h-4 w-4" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
            >
              <Download className="h-4 w-4" />
              Download (.txt)
            </button>
          </div>
        </div>
      )}
    >
      <div className="space-y-4">
        {/* Full message content with markdown rendering */}
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-6">
          <AssistantMessageContent content={content} />
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <Eye className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <p>
            This preview shows the full AI assistant response with formatting.
            Downloads will save as plain text (.txt) for clinical documentation.
          </p>
        </div>
      </div>
    </Modal>
  );
}
