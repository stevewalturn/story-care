'use client';

import { Archive, ArchiveRestore, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type SessionActionMenuProps = {
  isArchived: boolean;
  onRename: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
};

export function SessionActionMenu({
  isArchived,
  onRename,
  onArchive,
  onUnarchive,
  onDelete,
}: SessionActionMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showMenu) {
      setShowMenu(false);
      setMenuPosition(null);
    } else if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 192;
      const menuHeight = 140;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let left = rect.right - menuWidth;
      if (left < 8) left = rect.left;
      if (left + menuWidth > viewportWidth - 8) left = viewportWidth - menuWidth - 8;

      let top = rect.bottom + 4;
      if (top + menuHeight > viewportHeight - 8) top = rect.top - menuHeight - 4;

      setMenuPosition({ top, left });
      setShowMenu(true);
    }
  };

  const handleAction = (action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    setMenuPosition(null);
    action();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current
        && !menuRef.current.contains(e.target as Node)
        && buttonRef.current
        && !buttonRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false);
        setMenuPosition(null);
      }
    };

    const handleScroll = () => {
      setShowMenu(false);
      setMenuPosition(null);
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowMenu(false);
        setMenuPosition(null);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showMenu]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggleMenu}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        aria-label="Session actions"
        aria-haspopup="true"
        aria-expanded={showMenu}
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {showMenu && menuPosition && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          onClick={e => e.stopPropagation()}
        >
          {!isArchived && (
            <button
              type="button"
              onClick={handleAction(onRename)}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              <Pencil className="h-4 w-4" />
              Rename
            </button>
          )}

          <button
            type="button"
            onClick={handleAction(isArchived ? onUnarchive : onArchive)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
          >
            {isArchived
              ? (
                  <>
                    <ArchiveRestore className="h-4 w-4" />
                    Unarchive
                  </>
                )
              : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archive
                  </>
                )}
          </button>

          <hr className="my-1" />

          <button
            type="button"
            onClick={handleAction(onDelete)}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
