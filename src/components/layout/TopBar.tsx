'use client';

import { Share, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TopBarProps {
  title?: string;
  showShare?: boolean;
  showPreview?: boolean;
  showPublish?: boolean;
  onShare?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
}

export function TopBar({
  title,
  showShare = false,
  showPreview = false,
  showPublish = false,
  onShare,
  onPreview,
  onPublish,
}: TopBarProps) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      <div>
        {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {showShare && (
          <Button variant="secondary" size="md" onClick={onShare}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
        {showPreview && (
          <Button variant="secondary" size="md" onClick={onPreview}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}
        {showPublish && (
          <Button variant="primary" size="md" onClick={onPublish}>
            Publish
          </Button>
        )}
      </div>
    </header>
  );
}
