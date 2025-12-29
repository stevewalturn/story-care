'use client';

/**
 * Transcript Viewer Top Bar
 * White top bar with breadcrumb navigation and Library button
 * Matches Figma Workspace.png design - audio player is in TranscriptPanel
 */

import { ArrowLeft, ArrowRight, Bell, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type TranscriptTopBarProps = {
  sessionTitle?: string;
  groupName?: string;
  onBack?: () => void;
  onForward?: () => void;
  onLibraryToggle?: () => void;
  isLibraryOpen?: boolean;
  userAvatarUrl?: string;
  userName?: string;
};

export function TranscriptTopBar({
  sessionTitle = 'Session',
  groupName,
  onBack,
  onForward,
  onLibraryToggle,
  isLibraryOpen = false,
  userAvatarUrl,
  userName = 'User',
}: TranscriptTopBarProps) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4">
      {/* Left: Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        {/* Back/Forward Navigation Arrows */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBack || (() => window.history.back())}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onForward || (() => window.history.forward())}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            title="Go forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Breadcrumb Path */}
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            href="/sessions"
            className="text-gray-500 transition-colors hover:text-gray-700"
          >
            Sessions
          </Link>
          {groupName && (
            <>
              <ChevronRight className="h-4 w-4 text-gray-400" />
              <span className="text-gray-500">{groupName}</span>
            </>
          )}
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{sessionTitle}</span>
        </nav>
      </div>

      {/* Right: Notification, User Avatar, and Library Toggle */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* User Avatar Dropdown */}
        <button
          className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-gray-100"
          title="User menu"
        >
          {userAvatarUrl ? (
            <img
              src={userAvatarUrl}
              alt={userName}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500 text-sm font-medium text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
          )}
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </button>

        {/* Library Toggle Button */}
        <button
          onClick={onLibraryToggle}
          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
            isLibraryOpen
              ? 'border-purple-300 bg-purple-50 text-purple-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
          title={isLibraryOpen ? 'Hide Library' : 'Show Library'}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Library
        </button>
      </div>
    </div>
  );
}
