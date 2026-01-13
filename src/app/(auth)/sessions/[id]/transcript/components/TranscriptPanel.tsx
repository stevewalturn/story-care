'use client';

/**
 * Transcript Panel Component
 * Displays session transcript with search, summary, and speaker diarization
 * Matches Figma design with audio player and colored speaker initials
 */

import type { SaveQuoteData, SpeakerInfo, TranscriptPanelProps, Utterance } from '../types/transcript.types';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Download, Pause, Play, Users } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SelectionFloatingMenu } from './SelectionFloatingMenu';

// Speaker color mapping for initials - Matching Figma exactly
const speakerColors: Record<string, { bg: string; text: string }> = {
  therapist: { bg: 'bg-purple-500', text: 'text-white' },
  T: { bg: 'bg-purple-500', text: 'text-white' },
  A: { bg: 'bg-blue-500', text: 'text-white' },
  B: { bg: 'bg-blue-500', text: 'text-white' },
  J: { bg: 'bg-amber-500', text: 'text-white' },
  D: { bg: 'bg-red-400', text: 'text-white' },
  S: { bg: 'bg-teal-500', text: 'text-white' },
  C: { bg: 'bg-orange-500', text: 'text-white' },
  G: { bg: 'bg-green-500', text: 'text-white' },
  M: { bg: 'bg-pink-500', text: 'text-white' },
  P: { bg: 'bg-indigo-500', text: 'text-white' },
  default: { bg: 'bg-gray-500', text: 'text-white' },
};

const getSpeakerColor = (name: string, type?: string) => {
  if (type === 'therapist') return speakerColors.therapist;
  const initial = name.charAt(0).toUpperCase();
  return speakerColors[initial] || speakerColors.default;
};

export function TranscriptPanel({
  sessionId: _sessionId,
  sessionTitle,
  utterances,
  audioUrl,
  onTextSelection: _onTextSelection,
  onSaveQuote,
  user: _user,
  groupName,
  sessionDate,
  speakers = [],
  sessionPatients = [],
  onSpeakerReassign,
  isCollapsed = false,
  onToggleCollapse,
  seekToTimestamp,
  onSeekComplete,
  onOpenAnalyzeModal,
  onOpenSpeakerLabeling,
}: TranscriptPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  // Floating selection menu state
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [selectionMenuPosition, setSelectionMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedUtterance, setSelectedUtterance] = useState<Utterance | null>(null);

  // Speaker dropdown state
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [reassigningUtteranceId, setReassigningUtteranceId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const utteranceRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [highlightedUtteranceId, setHighlightedUtteranceId] = useState<string | null>(null);

  // Audio player handlers
  const togglePlay = async () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch (error) {
          console.error('Audio playback failed:', error);
          // Don't update state if play failed
        }
      }
    }
  };

  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + seconds));
    }
  };

  const changeSpeed = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedDropdown(false);
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration || 0);
    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlayThrough = () => {
      // Audio is ready to play through without buffering
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('ended', handleEnded);

    // Try to get duration if already loaded
    if (audio.duration && !isNaN(audio.duration)) {
      setDuration(audio.duration);
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Handle external seek requests (e.g., from Quote "Jump to Audio" button)
  useEffect(() => {
    if (seekToTimestamp !== null && seekToTimestamp !== undefined && audioRef.current) {
      audioRef.current.currentTime = seekToTimestamp;
      setCurrentTime(seekToTimestamp);

      // Find and scroll to the utterance that contains this timestamp
      const matchingUtterance = utterances.find(
        u => u.startTime <= seekToTimestamp && seekToTimestamp < u.endTime
      );
      if (matchingUtterance) {
        // Highlight the utterance temporarily
        setHighlightedUtteranceId(matchingUtterance.id);
        setTimeout(() => setHighlightedUtteranceId(null), 3000);

        // Scroll to the utterance
        const utteranceEl = utteranceRefs.current.get(matchingUtterance.id);
        if (utteranceEl) {
          utteranceEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }

      // Start playing from the new position
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Failed to play audio after seek:', err);
      });
      // Notify parent that seek is complete
      onSeekComplete?.();
    }
  }, [seekToTimestamp, onSeekComplete, utterances]);

  // Click outside handler for speaker dropdown
  useEffect(() => {
    if (!activeDropdownId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdownId]);

  // Handle speaker selection for reassignment
  const handleSpeakerSelect = async (utteranceId: string, newSpeakerId: string) => {
    if (!onSpeakerReassign) return;

    setReassigningUtteranceId(utteranceId);
    try {
      await onSpeakerReassign(utteranceId, newSpeakerId);
      setActiveDropdownId(null);
    } catch (error) {
      console.error('Failed to reassign speaker:', error);
    } finally {
      setReassigningUtteranceId(null);
    }
  };

  const formatAudioTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '00:00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle text selection to show floating menu
  const handleTextSelection = (event: React.MouseEvent) => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (!text || text.length === 0) {
      setShowSelectionMenu(false);
      return;
    }

    // Find which utterance the selection is within
    // Walk up from the selection's anchor node to find the utterance container
    let utteranceElement: HTMLElement | null = null;
    let node = selection?.anchorNode;
    while (node) {
      if (node instanceof HTMLElement && node.dataset.utteranceId) {
        utteranceElement = node;
        break;
      }
      node = node.parentNode;
    }

    if (!utteranceElement) {
      // Fallback: try using event target
      let target = event.target as HTMLElement | null;
      while (target && !target.dataset.utteranceId) {
        target = target.parentElement;
      }
      utteranceElement = target;
    }

    if (utteranceElement) {
      const utteranceId = utteranceElement.dataset.utteranceId;
      const utterance = utterances.find(u => u.id === utteranceId);

      if (utterance) {
        setSelectedUtterance(utterance);
        setSelectedText(text);

        // Position the menu near the selection
        const range = selection?.getRangeAt(0);
        if (range) {
          const rect = range.getBoundingClientRect();
          setSelectionMenuPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + 8,
          });
          setShowSelectionMenu(true);
        }
      }
    }
  };

  // Handle floating menu actions
  const handleSaveQuote = () => {
    if (selectedUtterance && selectedText && onSaveQuote) {
      const data: SaveQuoteData = {
        selectedText,
        speakerName: selectedUtterance.speakerName,
        speakerId: selectedUtterance.speakerId,
        speakerType: selectedUtterance.speakerType,
        startTime: selectedUtterance.startTime,
        endTime: selectedUtterance.endTime,
      };
      onSaveQuote(data);
    }
    setShowSelectionMenu(false);
  };

  const handleAnalyze = () => {
    onOpenAnalyzeModal?.();
    setShowSelectionMenu(false);
  };

  const handleCopy = () => {
    // Copy is handled in the SelectionFloatingMenu component
    // This callback is for any additional logic if needed
  };

  const handleCloseSelectionMenu = () => {
    setShowSelectionMenu(false);
  };

  // Extract unique speakers from utterances if not provided
  const displaySpeakers = useMemo(() => {
    if (speakers.length > 0) return speakers;

    // Derive from utterances
    const speakerMap = new Map<string, SpeakerInfo>();
    utterances.forEach((u) => {
      if (!speakerMap.has(u.speakerId)) {
        speakerMap.set(u.speakerId, {
          id: u.speakerId,
          name: u.speakerName,
          type: u.speakerType,
          avatarUrl: u.avatarUrl,
          referenceImageUrl: u.referenceImageUrl,
          initial: u.speakerName.charAt(0).toUpperCase(),
        });
      }
    });
    return Array.from(speakerMap.values());
  }, [speakers, utterances]);

  // Format session date for display with time
  const formattedDate = useMemo(() => {
    if (!sessionDate) return '';
    try {
      const date = new Date(sessionDate);
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${dateStr} at ${timeStr}`;
    } catch {
      return sessionDate;
    }
  }, [sessionDate]);

  // Find all utterances that match the search query (for navigation)
  const matchingUtteranceIds = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return utterances
      .filter(u => u.text.toLowerCase().includes(query) || u.speakerName.toLowerCase().includes(query))
      .map(u => u.id);
  }, [searchQuery, utterances]);

  // Reset match index when search changes
  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery]);

  // Highlight matching text in a string
  const highlightText = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="rounded bg-yellow-200 px-0.5 text-yellow-900">{part}</mark>
      ) : part,
    );
  };

  // Find the current utterance based on audio playback time
  const currentUtteranceId = useMemo(() => {
    if (!isPlaying && currentTime === 0) return null;
    const current = utterances.find(
      u => currentTime >= u.startTime && currentTime < u.endTime,
    );
    return current?.id || null;
  }, [currentTime, utterances, isPlaying]);

  // Auto-scroll to current utterance when it changes during playback
  useEffect(() => {
    if (currentUtteranceId && isPlaying && !searchQuery) {
      const utteranceEl = utteranceRefs.current.get(currentUtteranceId);
      if (utteranceEl && transcriptContainerRef.current) {
        utteranceEl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }, [currentUtteranceId, isPlaying, searchQuery]);

  // Auto-scroll to current search match
  useEffect(() => {
    if (matchingUtteranceIds.length > 0 && searchQuery) {
      const currentMatchId = matchingUtteranceIds[currentMatchIndex];
      if (currentMatchId) {
        const utteranceEl = utteranceRefs.current.get(currentMatchId);
        if (utteranceEl) {
          utteranceEl.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }
      }
    }
  }, [currentMatchIndex, matchingUtteranceIds, searchQuery]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Collapsed state - show thin strip with expand button
  if (isCollapsed) {
    return (
      <div className="flex h-full w-12 flex-col items-center border-r border-gray-200 bg-white py-3 transition-all duration-300">
        <button
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
          title="Expand transcript"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // Full panel
  return (
    <div className="flex h-full w-full flex-col border-r border-gray-200 bg-white transition-all duration-300">
      {/* Session Header - Compact */}
      <div className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-sm font-semibold text-[#111827]">
            {sessionTitle || 'Group Session - Aug 6, 2025 - 1st Session'}
          </h1>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              title="Collapse transcript"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="mb-3 flex items-center gap-2">
          {/* Patient Avatars - Only session-assigned patients (from session.patient or session.group.members) */}
          {sessionPatients.length > 0 && (
            <div className="flex -space-x-2">
              {sessionPatients.slice(0, 4).map((patient, index) => {
                const colors = getSpeakerColor(patient.name, 'patient') ?? speakerColors.default;
                const bgColorLight = colors?.bg?.replace('-500', '-200').replace('-400', '-200') ?? 'bg-gray-200';
                const textColor = colors?.bg?.replace('bg-', 'text-').replace('-500', '-700').replace('-400', '-700') ?? 'text-gray-700';

                return patient.avatarUrl ? (
                  <Image
                    key={patient.id}
                    src={patient.avatarUrl}
                    alt={patient.name}
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-full border-2 border-white object-cover"
                    style={{ zIndex: 10 - index }}
                  />
                ) : (
                  <div
                    key={patient.id}
                    className={`h-7 w-7 rounded-full ${bgColorLight} flex items-center justify-center border-2 border-white text-xs font-medium ${textColor}`}
                    style={{ zIndex: 10 - index }}
                    title={patient.name}
                  >
                    {patient.name.charAt(0).toUpperCase()}
                  </div>
                );
              })}
              {sessionPatients.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-medium text-gray-600">
                  +
                  {sessionPatients.length - 4}
                </div>
              )}
            </div>
          )}
          {groupName && (
            <>
              <span className="text-xs text-gray-600">{groupName}</span>
              <span className="text-gray-300">•</span>
            </>
          )}
          {formattedDate && (
            <span className="text-xs text-gray-500">{formattedDate}</span>
          )}
          {/* Edit Speakers Button */}
          {onOpenSpeakerLabeling && (
            <>
              <span className="text-gray-300">•</span>
              <button
                onClick={onOpenSpeakerLabeling}
                className="flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-medium text-gray-600 transition-colors hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                title="Edit speaker assignments"
              >
                <Users className="h-3 w-3" />
                <span>Edit Speakers</span>
              </button>
            </>
          )}
        </div>

        {/* Search with Navigation */}
        <div className="relative">
          <svg className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && matchingUtteranceIds.length > 0) {
                if (e.shiftKey) {
                  setCurrentMatchIndex(prev => prev > 0 ? prev - 1 : matchingUtteranceIds.length - 1);
                } else {
                  setCurrentMatchIndex(prev => prev < matchingUtteranceIds.length - 1 ? prev + 1 : 0);
                }
              }
            }}
            placeholder="Search"
            className={`w-full rounded-lg border bg-white py-1.5 pl-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none ${
              searchQuery ? 'border-purple-300 pr-24 focus:border-purple-500' : 'border-gray-200 pr-10 focus:border-purple-500'
            }`}
          />
          {/* Match counter and navigation - shown when searching */}
          {searchQuery ? (
            <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
              <span className="text-xs text-gray-500 tabular-nums">
                {matchingUtteranceIds.length > 0
                  ? `${currentMatchIndex + 1}/${matchingUtteranceIds.length}`
                  : '0/0'}
              </span>
              <button
                type="button"
                onClick={() => setCurrentMatchIndex(prev =>
                  prev > 0 ? prev - 1 : matchingUtteranceIds.length - 1,
                )}
                disabled={matchingUtteranceIds.length === 0}
                className="rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                title="Previous match (Shift+Enter)"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentMatchIndex(prev =>
                  prev < matchingUtteranceIds.length - 1 ? prev + 1 : 0,
                )}
                disabled={matchingUtteranceIds.length === 0}
                className="rounded p-0.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30"
                title="Next match (Enter)"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Audio Player - Modern & Minimal */}
      <div className="border-b-2 border-gray-200 bg-white px-4 py-3 shadow-sm">
        {/* Hidden audio element - presigned URLs don't need CORS */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onLoadedMetadata={() => {
              if (audioRef.current) {
                setDuration(audioRef.current.duration);
                setAudioError(null); // Clear any previous error on successful load
              }
            }}
            onError={(e) => {
              console.error('Audio load error:', e);
              setAudioError('Failed to load audio. The file may be unavailable or the link may have expired.');
            }}
          />
        )}

        <div className="space-y-2">
          {/* Row 1: Controls */}
          <div className="flex items-center justify-between">
            {/* Left side: Play button and skip controls */}
            <div className="flex items-center gap-2">
              {/* Play Button - Modern Black */}
              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white transition-colors hover:bg-gray-800 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
              </button>

              {/* Skip Back 10 seconds */}
              <button
                onClick={() => skipTime(-10)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <span className="text-sm font-medium">10</span>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 12l-10 7V5l10 7z" />
                </svg>
              </button>

              {/* Skip Forward 10 seconds */}
              <button
                onClick={() => skipTime(10)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12l10-7v14l-10-7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 4v16" />
                </svg>
                <span className="text-sm font-medium">10</span>
              </button>
            </div>

            {/* Right side: Time, speed, and download */}
            <div className="flex items-center gap-3">
              {/* Time display - Larger */}
              <div className="text-sm text-gray-600 tabular-nums">
                {formatAudioTime(currentTime)}
                /
                {formatAudioTime(duration)}
              </div>

              {/* Speed Selector - Properly Aligned */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedDropdown(!showSpeedDropdown)}
                  className="flex h-10 items-center justify-center rounded-lg border border-gray-200 bg-white px-3 transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-gray-300 focus:outline-none"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {playbackSpeed}
                    x
                  </span>
                  <ChevronDown className="ml-1 h-4 w-4 text-gray-500" />
                </button>
                {showSpeedDropdown && (
                  <div className="absolute right-0 bottom-full mb-2 min-w-[100px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                      <button
                        key={speed}
                        onClick={() => changeSpeed(speed)}
                        className={`block w-full px-3 py-1.5 text-left text-sm transition-colors ${
                          playbackSpeed === speed ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {speed}
                        x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Download - Consistent Size */}
              <button
                onClick={() => {
                  if (audioUrl) {
                    const link = document.createElement('a');
                    link.href = audioUrl;
                    link.download = `${sessionTitle || 'session'}-audio.mp3`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!audioUrl}
                className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Download audio"
              >
                <Download className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Row 2: Progress Bar */}
          <div
            className="relative h-1 cursor-pointer overflow-hidden rounded-full bg-gray-200"
            onClick={(e) => {
              if (audioRef.current && duration > 0) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const percentage = x / rect.width;
                const newTime = percentage * duration;
                audioRef.current.currentTime = newTime;
                setCurrentTime(newTime);
              }
            }}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gray-900 transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Audio Error Message */}
          {audioError && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
              <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{audioError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Instruction Banner - Seamless */}
      <div className="border-b border-purple-100 bg-white px-4 py-2">
        <div className="flex items-center gap-2">
          <svg className="h-3.5 w-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          <p className="text-xs font-medium text-gray-600">
            Select text to save as quote, analyze, or copy
          </p>
        </div>
      </div>

      {/* Transcript Messages - Matching Figma */}
      <div
        ref={transcriptContainerRef}
        className="flex-1 space-y-4 overflow-y-auto bg-white p-4"
        onMouseUp={handleTextSelection}
      >
        {utterances.map((utterance: Utterance) => {
          const speakerColor = getSpeakerColor(utterance.speakerName, utterance.speakerType) ?? speakerColors.default;
          const initial = utterance.speakerName.charAt(0).toUpperCase();
          const isCurrentUtterance = currentUtteranceId === utterance.id;
          const isCurrentSearchMatch = searchQuery && matchingUtteranceIds[currentMatchIndex] === utterance.id;
          const isSearchMatch = searchQuery && matchingUtteranceIds.includes(utterance.id);
          const isHighlightedFromSeek = highlightedUtteranceId === utterance.id;

          return (
            <div
              key={utterance.id}
              data-utterance-id={utterance.id}
              ref={(el) => {
                if (el) utteranceRefs.current.set(utterance.id, el);
              }}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = utterance.startTime;
                  setCurrentTime(utterance.startTime);
                  if (!isPlaying) {
                    audioRef.current.play();
                    setIsPlaying(true);
                  }
                }
              }}
              className={`-mx-2 flex cursor-pointer gap-3 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-50 ${
                isHighlightedFromSeek
                  ? 'ring-2 ring-purple-400 bg-purple-50 border-l-2 border-purple-500'
                  : isCurrentUtterance
                    ? 'border-l-2 border-purple-500 bg-purple-50'
                    : isCurrentSearchMatch
                      ? 'border-l-2 border-yellow-400 bg-yellow-50'
                      : isSearchMatch
                        ? 'bg-yellow-50/50'
                        : ''
              }`}
            >
              {/* Speaker Avatar - Use actual photo if available, otherwise colored initial */}
              {utterance.avatarUrl ? (
                <Image
                  src={utterance.avatarUrl}
                  alt={utterance.speakerName}
                  width={24}
                  height={24}
                  className="h-6 w-6 flex-shrink-0 rounded-full object-cover select-none"
                />
              ) : (
                <div className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full select-none ${speakerColor?.bg ?? 'bg-gray-400'}`}>
                  <span className={`text-xs font-semibold ${speakerColor?.text ?? 'text-white'}`}>{initial}</span>
                </div>
              )}

              {/* Message Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2 select-none">
                  {/* Speaker Name with Dropdown */}
                  <div className="relative" ref={activeDropdownId === utterance.id ? dropdownRef : undefined}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdownId(
                          activeDropdownId === utterance.id ? null : utterance.id,
                        );
                      }}
                      disabled={reassigningUtteranceId === utterance.id}
                      className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                        reassigningUtteranceId === utterance.id
                          ? 'cursor-wait text-gray-400'
                          : 'text-gray-900 hover:text-gray-700'
                      }`}
                    >
                      {reassigningUtteranceId === utterance.id && (
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                      )}
                      {utterance.speakerName}
                      <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${
                        activeDropdownId === utterance.id ? 'rotate-180' : ''
                      }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdownId === utterance.id && displaySpeakers.length > 0 && (
                      <div className="absolute top-full left-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                        {displaySpeakers.map((speaker) => {
                          const isCurrentSpeaker = speaker.id === utterance.speakerId;
                          const dropdownSpeakerColor = getSpeakerColor(speaker.name, speaker.type);
                          const imageUrl = speaker.avatarUrl || speaker.referenceImageUrl;

                          return (
                            <button
                              key={speaker.id}
                              onClick={() => !isCurrentSpeaker && handleSpeakerSelect(utterance.id, speaker.id)}
                              disabled={isCurrentSpeaker}
                              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                                isCurrentSpeaker
                                  ? 'cursor-default bg-purple-50 text-purple-700'
                                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                              }`}
                            >
                              {/* Speaker Avatar */}
                              {imageUrl ? (
                                <Image
                                  src={imageUrl}
                                  alt={speaker.name}
                                  width={20}
                                  height={20}
                                  className="h-5 w-5 rounded-full object-cover"
                                />
                              ) : (
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${dropdownSpeakerColor?.bg ?? 'bg-gray-400'}`}>
                                  <span className={`text-[10px] font-semibold ${dropdownSpeakerColor?.text ?? 'text-white'}`}>
                                    {speaker.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="flex-1">{speaker.name}</span>
                              {isCurrentSpeaker && (
                                <svg className="h-4 w-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-300">•</span>
                  {/* Timestamp - Clickable to seek */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (audioRef.current) {
                        audioRef.current.currentTime = utterance.startTime;
                        setCurrentTime(utterance.startTime);
                        if (!isPlaying) {
                          audioRef.current.play();
                          setIsPlaying(true);
                        }
                      }
                    }}
                    className="text-xs font-medium text-gray-500 transition-colors hover:text-purple-600"
                    title="Jump to this point"
                  >
                    {formatTime(utterance.startTime)}
                  </button>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {highlightText(utterance.text, searchQuery)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Floating Menu */}
      <SelectionFloatingMenu
        isVisible={showSelectionMenu}
        position={selectionMenuPosition}
        selectedText={selectedText}
        onSaveQuote={handleSaveQuote}
        onAnalyze={handleAnalyze}
        onCopy={handleCopy}
        onClose={handleCloseSelectionMenu}
      />
    </div>
  );
}
