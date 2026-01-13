'use client';

/**
 * Selection Floating Menu Component
 * Shows a floating action menu when text is selected in the transcript
 */

import { Copy, MessageSquare, Quote } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type SelectionFloatingMenuProps = {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  onSaveQuote: () => void;
  onAnalyze: () => void;
  onCopy: () => void;
  onClose: () => void;
};

export function SelectionFloatingMenu({
  isVisible,
  position,
  selectedText,
  onSaveQuote,
  onAnalyze,
  onCopy,
  onClose,
}: SelectionFloatingMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [copied, setCopied] = useState(false);

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (!isVisible || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newX = position.x;
    let newY = position.y;

    // Adjust horizontal position if menu would overflow
    if (position.x + rect.width > viewportWidth - 20) {
      newX = viewportWidth - rect.width - 20;
    }
    if (newX < 20) {
      newX = 20;
    }

    // Adjust vertical position if menu would overflow
    if (position.y + rect.height > viewportHeight - 20) {
      newY = position.y - rect.height - 10; // Show above selection
    }

    setAdjustedPosition({ x: newX, y: newY });
  }, [isVisible, position]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isVisible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Delay adding listener to prevent immediate close
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isVisible) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible, onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    onCopy();
  };

  if (!isVisible || !selectedText) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-lg">
        {/* Save as Quote */}
        <button
          onClick={() => {
            onSaveQuote();
            onClose();
          }}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
          title="Save as Quote"
        >
          <Quote className="h-3.5 w-3.5" />
          Save Quote
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Analyze */}
        <button
          onClick={() => {
            onAnalyze();
            onClose();
          }}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-purple-50 hover:text-purple-700"
          title="Analyze with AI"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Analyze
        </button>

        {/* Divider */}
        <div className="h-5 w-px bg-gray-200" />

        {/* Copy */}
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            copied
              ? 'bg-green-50 text-green-700'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          title="Copy to clipboard"
        >
          <Copy className="h-3.5 w-3.5" />
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
