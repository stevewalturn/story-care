'use client';

/**
 * GenericJSONDisplay Component
 *
 * Recursively renders ANY JSON structure in a user-friendly way.
 * Auto-detects patterns and renders them appropriately:
 * - image_url → Image preview
 * - audio_url → Audio player
 * - Arrays → Lists
 * - Objects → Nested cards
 * - Primitives → Text
 *
 * Phase 4 Implementation: Fallback for non-block prompts
 */

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileText,
  List,
  Code,
  Link as LinkIcon,
} from 'lucide-react';

interface GenericJSONDisplayProps {
  data: any;
  title?: string;
  level?: number;
  maxDepth?: number;
}

/**
 * Detect if a string is a URL
 */
function isURL(str: string): boolean {
  if (typeof str !== 'string') return false;
  try {
    new URL(str);
    return true;
  } catch {
    return str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/');
  }
}

/**
 * Detect if a URL is an image
 */
function isImageURL(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url) || url.includes('image_url') || url.includes('imageUrl');
}

/**
 * Detect if a URL is an audio file
 */
function isAudioURL(url: string): boolean {
  return /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url) || url.includes('audio_url') || url.includes('audioUrl');
}

/**
 * Detect if a URL is a video file
 */
function isVideoURL(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || url.includes('video_url') || url.includes('videoUrl');
}

/**
 * Render a primitive value (string, number, boolean, null)
 */
function PrimitiveValue({ value, fieldName }: { value: any; fieldName?: string }) {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">null</span>;
  }

  // Handle boolean
  if (typeof value === 'boolean') {
    return (
      <span className={`font-medium ${value ? 'text-green-600' : 'text-red-600'}`}>
        {value ? 'true' : 'false'}
      </span>
    );
  }

  // Handle number
  if (typeof value === 'number') {
    return <span className="text-blue-600 font-mono">{value}</span>;
  }

  // Handle string
  const str = String(value);

  // Check if it's a URL
  if (isURL(str)) {
    // Image URL
    if (isImageURL(str)) {
      return (
        <div className="mt-2">
          <img src={str} alt={fieldName || 'Image'} className="max-w-full rounded-lg border border-gray-200" />
        </div>
      );
    }

    // Audio URL
    if (isAudioURL(str)) {
      return (
        <div className="mt-2">
          <audio controls className="w-full max-w-md">
            <source src={str} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Video URL
    if (isVideoURL(str)) {
      return (
        <div className="mt-2">
          <video controls className="max-w-full rounded-lg border border-gray-200">
            <source src={str} />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Generic URL
    return (
      <a
        href={str}
        target="_blank"
        rel="noopener noreferrer"
        className="text-indigo-600 hover:underline inline-flex items-center gap-1"
      >
        <LinkIcon className="h-3 w-3" />
        {str}
      </a>
    );
  }

  // Long text (multiline)
  if (str.length > 100 || str.includes('\n')) {
    return <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">{str}</pre>;
  }

  // Short text
  return <span className="text-gray-900">{str}</span>;
}

/**
 * Render an array
 */
function ArrayDisplay({ array, fieldName, level = 0 }: { array: any[]; fieldName?: string; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);

  if (array.length === 0) {
    return <span className="text-gray-400 italic">[]</span>;
  }

  // Check if all items are primitives
  const allPrimitives = array.every(item => typeof item !== 'object' || item === null);

  if (allPrimitives) {
    return (
      <div className="space-y-1">
        {array.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <span className="text-gray-400 text-sm">•</span>
            <PrimitiveValue value={item} />
          </div>
        ))}
      </div>
    );
  }

  // Complex array
  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
      >
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        <List className="h-4 w-4" />
        {fieldName || 'Array'} ({array.length} items)
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
          {array.map((item, index) => (
            <div key={index}>
              <GenericJSONDisplay
                data={item}
                title={`Item ${index + 1}`}
                level={level + 1}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Render an object
 */
function ObjectDisplay({ obj, title, level = 0 }: { obj: Record<string, any>; title?: string; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const entries = Object.entries(obj);

  if (entries.length === 0) {
    return <span className="text-gray-400 italic">{'{}'}</span>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-900">{title || 'Object'}</span>
          <span className="text-xs text-gray-500">({entries.length} fields)</span>
        </div>
        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-3 space-y-3 bg-gray-50">
          {entries.map(([key, value]) => (
            <div key={key}>
              <div className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">{key}:</div>
              <div className="pl-3">
                <GenericJSONDisplay data={value} level={level + 1} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main GenericJSONDisplay Component
 */
export function GenericJSONDisplay({ data, title, level = 0, maxDepth = 10 }: GenericJSONDisplayProps) {
  // Prevent infinite recursion
  if (level > maxDepth) {
    return (
      <div className="rounded bg-yellow-50 border border-yellow-200 p-2 text-xs text-yellow-800">
        Max depth reached. Data too deeply nested.
      </div>
    );
  }

  // Handle null/undefined
  if (data === null || data === undefined) {
    return <PrimitiveValue value={data} />;
  }

  // Handle arrays
  if (Array.isArray(data)) {
    return <ArrayDisplay array={data} level={level} />;
  }

  // Handle objects
  if (typeof data === 'object') {
    return <ObjectDisplay obj={data} title={title} level={level} />;
  }

  // Handle primitives
  return <PrimitiveValue value={data} />;
}

/**
 * Wrapper component with top-level styling
 */
export function GenericJSONCard({ data, title = 'Output' }: { data: any; title?: string }) {
  return (
    <div className="rounded-lg border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Code className="h-5 w-5 text-gray-600" />
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>

      <GenericJSONDisplay data={data} level={0} />
    </div>
  );
}
