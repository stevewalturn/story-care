'use client';

/**
 * SlashCommandMenu Component
 *
 * Dropdown menu that appears when "/" is typed in chat (like Notion)
 * Allows quick insertion of command templates
 */

import { useEffect, useState, useRef } from 'react';
import type { SlashCommand } from '@/types/BuildingBlocks';
import { SLASH_COMMANDS, filterSlashCommands } from '@/config/SlashCommands';

interface SlashCommandMenuProps {
  position: { x: number; y: number };
  onSelectCommand: (command: SlashCommand) => void;
  onClose: () => void;
  searchQuery: string;
  visible: boolean;
}

export default function SlashCommandMenu({
  position,
  onSelectCommand,
  onClose,
  searchQuery,
  visible,
}: SlashCommandMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = searchQuery
    ? filterSlashCommands(searchQuery)
    : SLASH_COMMANDS;

  // Reset selection when commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev =>
            prev < filteredCommands.length - 1 ? prev + 1 : prev,
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
          break;

        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            onSelectCommand(filteredCommands[selectedIndex]);
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, selectedIndex, filteredCommands, onSelectCommand, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (menuRef.current) {
      const selectedElement = menuRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!visible || filteredCommands.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 w-80 overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl"
        style={{
          top: position.y,
          left: position.x,
          maxHeight: '320px',
        }}
      >
        {/* Header */}
        <div className="border-b border-gray-200 px-3 py-2">
          <p className="text-xs font-medium text-gray-500">
            {searchQuery ? `Commands matching "${searchQuery}"` : 'Slash Commands'}
          </p>
        </div>

        {/* Commands list */}
        <div className="py-1">
          {filteredCommands.map((command, index) => (
            <button
              key={command.id}
              onClick={() => onSelectCommand(command)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl flex-shrink-0">{command.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{command.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-mono ${
                      index === selectedIndex
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {command.trigger}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{command.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-200 px-3 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 border border-gray-300 font-mono">
                ↑↓
              </kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 border border-gray-300 font-mono">
                ↵
              </kbd>
              Select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-white px-1.5 py-0.5 border border-gray-300 font-mono">
                Esc
              </kbd>
              Close
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
