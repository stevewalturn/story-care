'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Play, Pause, ChevronDown, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface Utterance {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerType: 'therapist' | 'patient' | 'group_member';
  text: string;
  startTime: number; // in seconds
  endTime: number;
  confidence: number; // 0-1
}

interface TranscriptViewerProps {
  sessionId: string;
  utterances: Utterance[];
  audioUrl?: string;
  onTextSelect: (text: string, utteranceIds: string[]) => void;
}

export function TranscriptViewer({
  sessionId,
  utterances,
  audioUrl,
  onTextSelect,
}: TranscriptViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [selectedUtteranceIds, setSelectedUtteranceIds] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // Filter utterances by search query
  const filteredUtterances = searchQuery
    ? utterances.filter((u) =>
        u.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.speakerName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : utterances;

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 0) {
      setSelectedText(text);

      // Find which utterances contain the selected text
      const selectedIds: string[] = [];
      utterances.forEach((u) => {
        if (text.includes(u.text) || u.text.includes(text)) {
          selectedIds.push(u.id);
        }
      });
      setSelectedUtteranceIds(selectedIds);
      setShowAIPanel(true);
    } else {
      setSelectedText('');
      setSelectedUtteranceIds([]);
      setShowAIPanel(false);
    }
  };

  // Handle audio playback
  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const jumpToTime = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeakerColor = (type: string) => {
    switch (type) {
      case 'therapist':
        return 'bg-blue-100 text-blue-700';
      case 'patient':
        return 'bg-green-100 text-green-700';
      case 'group_member':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Highlight current utterance based on audio time
  const isCurrentUtterance = (utterance: Utterance) => {
    return currentTime >= utterance.startTime && currentTime < utterance.endTime;
  };

  useEffect(() => {
    // Add event listener for text selection
    document.addEventListener('mouseup', handleTextSelection);
    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
    };
  }, []);

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Main Transcript Area */}
      <div className="flex-1 flex flex-col">
        {/* Search & Controls */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transcript..."
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          {audioUrl && (
            <Button variant="icon" onClick={togglePlayPause}>
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>

        {/* Transcript */}
        <div
          ref={transcriptRef}
          className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-6 space-y-4 bg-white"
        >
          {filteredUtterances.map((utterance) => {
            const isCurrent = isCurrentUtterance(utterance);
            const isSelected = selectedUtteranceIds.includes(utterance.id);

            return (
              <div
                key={utterance.id}
                className={`transition-all ${
                  isCurrent ? 'bg-yellow-50 -mx-2 px-2 py-1 rounded' : ''
                } ${isSelected ? 'bg-indigo-50 -mx-2 px-2 py-1 rounded' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Speaker Badge */}
                  <button
                    onClick={() => jumpToTime(utterance.startTime)}
                    className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium ${getSpeakerColor(
                      utterance.speakerType
                    )} hover:opacity-80 transition-opacity`}
                  >
                    {utterance.speakerName}
                  </button>

                  {/* Timestamp */}
                  <button
                    onClick={() => jumpToTime(utterance.startTime)}
                    className="text-xs text-gray-500 hover:text-gray-700 flex-shrink-0 font-mono"
                  >
                    {formatTime(utterance.startTime)}
                  </button>

                  {/* Text */}
                  <p className="flex-1 text-gray-900 leading-relaxed select-text">
                    {utterance.text}
                  </p>
                </div>
              </div>
            );
          })}

          {filteredUtterances.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Audio Player (hidden but functional) */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />
        )}
      </div>

      {/* AI Assistant Panel */}
      {showAIPanel && selectedText && (
        <div className="w-96 flex flex-col border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            </div>
            <p className="text-xs text-gray-600">
              {selectedText.length} characters selected from {selectedUtteranceIds.length} utterance(s)
            </p>
          </div>

          {/* Selected Text Preview */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700 italic line-clamp-3">
              "{selectedText}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-2">
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => onTextSelect(selectedText, selectedUtteranceIds)}
              >
                Analyze with AI
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => onTextSelect(selectedText, selectedUtteranceIds)}
              >
                Extract Quote
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => onTextSelect(selectedText, selectedUtteranceIds)}
              >
                Generate Image
              </Button>
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={() => onTextSelect(selectedText, selectedUtteranceIds)}
              >
                Create Note
              </Button>
            </div>
          </div>

          {/* Close Button */}
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setShowAIPanel(false);
                setSelectedText('');
                setSelectedUtteranceIds([]);
                window.getSelection()?.removeAllRanges();
              }}
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
