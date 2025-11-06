'use client';

import { Eye, Share } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type TopBarProps = {
  title?: string;
  showShare?: boolean;
  showPreview?: boolean;
  showPublish?: boolean;
  onShare?: () => void;
  onPreview?: () => void;
  onPublish?: () => void;
};

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
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div>
        {title && <h1 className="text-xl font-semibold text-gray-900">{title}</h1>}
      </div>

      <div className="flex items-center gap-3">
        {showShare && (
          <Button variant="secondary" size="md" onClick={onShare}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
        )}
        {showPreview && (
          <Button variant="secondary" size="md" onClick={onPreview}>
            <Eye className="mr-2 h-4 w-4" />
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
