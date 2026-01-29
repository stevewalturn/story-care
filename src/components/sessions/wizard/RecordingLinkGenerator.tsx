'use client';

import type { SessionFormData } from '@/components/sessions/wizard/types';
import { Check, Clock, Copy, ExternalLink, Link2, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/contexts/AuthContext';

type RecordingLinkGeneratorProps = {
  formData: SessionFormData;
  onLinkCreated: (linkId: string, token: string) => void;
  onError?: (error: Error) => void;
};

const EXPIRY_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 1440, label: '24 hours' },
  { value: 4320, label: '3 days' },
  { value: 10080, label: '7 days' },
];

export function RecordingLinkGenerator({
  formData,
  onLinkCreated,
  onError,
}: RecordingLinkGeneratorProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [expiryMinutes, setExpiryMinutes] = useState(1440); // Default 24 hours
  const [notes, setNotes] = useState('');

  const generateLink = async () => {
    if (!user) {
      onError?.(new Error('You must be logged in to generate a link'));
      return;
    }

    setIsGenerating(true);

    try {
      const idToken = await user.getIdToken();

      const response = await fetch('/api/recording-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          sessionTitle: formData.title || undefined,
          sessionDate: formData.sessionDate || undefined,
          patientIds: formData.patientIds?.length > 0 ? formData.patientIds : undefined,
          notes: notes.trim() || undefined,
          expiryDurationMinutes: expiryMinutes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate link');
      }

      const data = await response.json();
      setGeneratedLink(data.shareUrl);
      onLinkCreated(data.linkId, data.token);
    } catch (error) {
      console.error('Failed to generate link:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to generate link'));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!generatedLink) return;

    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const openLink = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank');
    }
  };

  // Link generated state
  if (generatedLink) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Link2 className="h-8 w-8 text-green-600" />
        </div>

        <h3 className="mb-2 text-lg font-semibold text-gray-900">Link Generated!</h3>
        <p className="mb-6 text-center text-sm text-gray-500">
          Share this link to allow recording on any device
        </p>

        {/* Link display */}
        <div className="mb-4 w-full max-w-md">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <Input
              value={generatedLink}
              readOnly
              className="flex-1 border-0 bg-transparent text-sm focus:ring-0"
            />
            <button
              onClick={copyToClipboard}
              className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-gray-600 shadow-sm transition-colors hover:bg-gray-100"
              aria-label="Copy link"
            >
              {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="secondary" onClick={openLink}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Link
          </Button>
          <Button variant="secondary" onClick={() => setGeneratedLink(null)}>
            Generate New Link
          </Button>
        </div>

        {/* Expiry info */}
        <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>
            Expires in
            {' '}
            {EXPIRY_OPTIONS.find(o => o.value === expiryMinutes)?.label}
          </span>
        </div>

        {/* QR Code */}
        <div className="mt-6 flex flex-col items-center">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <QRCodeSVG
              value={generatedLink}
              size={128}
              level="M"
              includeMargin={false}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">Scan to open on mobile</p>
        </div>
      </div>
    );
  }

  // Generate link form
  return (
    <div className="py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <Link2 className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Generate Recording Link</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create a shareable link for recording on mobile devices
          </p>
        </div>

        <div className="space-y-4">
          {/* Expiration dropdown */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Link Expiration
            </label>
            <select
              value={expiryMinutes}
              onChange={e => setExpiryMinutes(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
            >
              {EXPIRY_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes/Instructions */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Instructions for Recorder (Optional)
            </label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any instructions or notes for the person recording..."
              rows={3}
              className="text-sm"
            />
          </div>

          {/* Pre-filled info display */}
          {(formData.title || formData.patientIds?.length > 0) && (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="mb-1 text-xs font-medium text-gray-500 uppercase">Pre-filled Session Info</p>
              {formData.title && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Title:</span>
                  {' '}
                  {formData.title}
                </p>
              )}
              {formData.patientIds?.length > 0 && (
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Patients:</span>
                  {' '}
                  {formData.patientIds.length}
                  {' '}
                  selected
                </p>
              )}
            </div>
          )}

          {/* Generate button */}
          <Button
            variant="primary"
            onClick={generateLink}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating
              ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                )
              : (
                  <>
                    <Link2 className="mr-2 h-4 w-4" />
                    Generate Link
                  </>
                )}
          </Button>
        </div>
      </div>
    </div>
  );
}
