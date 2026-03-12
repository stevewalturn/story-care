'use client';

/**
 * PhoneOtpVerifier
 * Handles Firebase Phone Authentication (SMS OTP) flow for account setup and sign-in.
 * Uses invisible reCAPTCHA — no visible challenge for users.
 *
 * Note: Firebase PNV (carrier-based, no SMS) is Android-only.
 * This component uses Firebase Phone Auth (SMS OTP) which works on web.
 */

import type { ConfirmationResult, RecaptchaVerifier, User } from 'firebase/auth';
import { Loader2, Phone, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { confirmPhoneOtp, sendPhoneOtp } from '@/libs/Firebase';

type Props = {
  phoneNumber: string;
  phoneMasked: string;
  onSuccess: (user: User) => void;
  onCancel: () => void;
};

type PhoneStep = 'sending' | 'otp' | 'verifying';

export function PhoneOtpVerifier({ phoneNumber, phoneMasked, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<PhoneStep>('sending');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerId = 'phone-recaptcha-container';

  const sentOnceRef = useRef(false);

  // Automatically send OTP on mount; clear verifier on unmount
  // sentOnceRef guard prevents StrictMode's double-invocation from sending OTP twice
  useEffect(() => {
    if (sentOnceRef.current) return;
    sentOnceRef.current = true;
    handleSendOtp();
    return () => {
      try {
        recaptchaVerifierRef.current?.clear();
      }
      catch { /* ignore */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOtp = async () => {
    setStep('sending');
    setError('');

    const { confirmationResult, recaptchaVerifier, error: sendError } = await sendPhoneOtp(
      phoneNumber,
      recaptchaContainerId,
      recaptchaVerifierRef.current, // pass old verifier so it can be cleared before creating new
    );

    if (sendError || !confirmationResult) {
      setError(humanizePhoneError(sendError || 'Failed to send OTP'));
      setStep('otp'); // Show OTP input with resend option
      return;
    }

    recaptchaVerifierRef.current = recaptchaVerifier;
    confirmationRef.current = confirmationResult;
    setStep('otp');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationRef.current) {
      setError('Session expired. Please resend the code.');
      return;
    }

    setStep('verifying');
    setError('');

    const { user, error: verifyError } = await confirmPhoneOtp(confirmationRef.current, code);

    if (verifyError || !user) {
      setError(humanizePhoneError(verifyError || 'Verification failed'));
      setStep('otp');
      return;
    }

    onSuccess(user);
  };

  return (
    <div className="space-y-4">
      {/* Hidden reCAPTCHA container — Firebase attaches invisible widget here */}
      <div id={recaptchaContainerId} />

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm">
            <p className="font-medium text-blue-900">Phone Verification</p>
            <p className="mt-1 text-blue-700">
              {step === 'sending'
                ? 'Sending code...'
                : `SMS code sent to ${phoneMasked}`}
            </p>
          </div>
        </div>
      </div>

      {step === 'sending' && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      )}

      {(step === 'otp' || step === 'verifying') && (
        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            type="text"
            label="Enter 6-digit code"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
              setError('');
            }}
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            disabled={step === 'verifying'}
          />

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={code.length < 6 || step === 'verifying'}
          >
            {step === 'verifying'
              ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {' '}
                    Verifying...
                  </>
                )
              : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    {' '}
                    Verify Code
                  </>
                )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={step === 'verifying'}
              className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={step === 'verifying'}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Back
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function humanizePhoneError(error: string): string {
  if (error.includes('invalid-phone-number')) return 'Invalid phone number format.';
  if (error.includes('too-many-requests')) return 'Too many attempts. Please wait a few minutes and try again.';
  if (error.includes('invalid-verification-code')) return 'Incorrect code. Please check and try again.';
  if (error.includes('code-expired')) return 'Code has expired. Please request a new one.';
  if (error.includes('session-expired')) return 'Session expired. Please resend the code.';
  if (error.includes('quota-exceeded')) return 'SMS quota exceeded. Please try again later.';
  return 'Verification failed. Please try again.';
}
