'use client';

import { ChevronLeft, ChevronRight, Download, Share2, Trash2, X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

type ImageLightboxProps = {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onDelete?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
};

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
  onDelete,
  onShare,
  onDownload,
}: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      {/* Top Bar */}
      <div className="absolute top-0 right-0 left-0 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-white hover:bg-white/10"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </Button>
          )}
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onShare}
              className="text-white hover:bg-white/10"
            >
              <Share2 className="mr-2 size-4" />
              Share
            </Button>
          )}
          {onDownload && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="text-white hover:bg-white/10"
            >
              <Download className="mr-2 size-4" />
              Download
            </Button>
          )}
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-2 text-white transition-colors hover:bg-white/10"
        >
          <X className="size-6" />
        </button>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <ChevronLeft className="size-6" />
        </button>
      )}

      {currentIndex < images.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 rounded-full bg-white/10 p-3 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        >
          <ChevronRight className="size-6" />
        </button>
      )}

      {/* Image */}
      <div className="relative max-h-[90vh] max-w-[90vw]">
        <img
          src={images[currentIndex]}
          alt={`Image ${currentIndex + 1}`}
          className="max-h-[90vh] max-w-[90vw] object-contain"
        />
      </div>

      {/* Counter */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
        {currentIndex + 1}
        {' '}
        /
        {images.length}
      </div>
    </div>
  );
}
