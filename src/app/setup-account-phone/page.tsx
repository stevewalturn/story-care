/**
 * Setup Account (Phone) Page
 * For phone-invited users to verify identity via SMS OTP, then create their password.
 * No invitation token required — identity is proved by phone OTP.
 * Feature-flagged: if enablePhoneVerification is off, redirects to /setup-account.
 */

'use client';

import type { User } from 'firebase/auth';
import { AlertCircle, ArrowRight, Check, Loader2, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { PhoneOtpVerifier } from '@/components/auth/PhoneOtpVerifier';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUpNoVerification } from '@/libs/Firebase';
import { humanizeFirebaseError } from '@/utils/FirebaseErrorMessages';

type Step = 'loading' | 'enter-phone' | 'confirm-invitation' | 'phone-otp' | 'create-password' | 'success' | 'error';

type InvitationDetails = {
  email: string;
  name: string;
  role: string;
  organizationName: string;
};

function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return `***-***-${phone.slice(-4)}`;
}

function SetupAccountPhoneForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('loading');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [phoneFirebaseUser, setPhoneFirebaseUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check feature flag on mount; redirect if disabled
  useEffect(() => {
    fetch('/api/features/public')
      .then(r => r.json())
      .then((data) => {
        if (!data.enablePhoneVerification) {
          router.replace('/setup-account');
        } else {
          setStep('enter-phone');
        }
      })
      .catch(() => router.replace('/setup-account'));
  }, [router]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/check-phone-invitation?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No pending invitation found for this phone number.');
        setLoading(false);
        return;
      }
      setInvitation(data);
      setStep('confirm-invitation');
    } catch {
      setError('Failed to check invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSuccess = (firebaseUser: User) => {
    setPhoneFirebaseUser(firebaseUser);
    // invitation already loaded in handlePhoneSubmit — go straight to password step
    setStep('create-password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!invitation || !phoneFirebaseUser) return;

    setLoading(true);

    try {
      // Create email/password Firebase account (no verification email)
      const { user: emailUser, error: signUpError } = await signUpNoVerification(
        invitation.email,
        password,
      );

      if (signUpError || !emailUser) {
        setError(humanizeFirebaseError(signUpError || 'Failed to create account.'));
        setLoading(false);
        return;
      }

      // Link this new email/password Firebase user to the DB user (identified by phone)
      const idToken = await emailUser.getIdToken();
      const linkRes = await fetch('/api/auth/link-firebase-uid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ email: invitation.email, phoneVerified: true }),
      });

      const linkData = await linkRes.json();

      if (!linkRes.ok) {
        if (linkRes.status === 409) {
          setError('This account has already been activated. Please sign in.');
          setTimeout(() => router.push('/sign-in'), 2000);
        } else {
          setError(linkData.error || 'Failed to activate account. Please try again.');
        }
        setLoading(false);
        return;
      }

      setStep('success');
      setTimeout(() => router.push('/sign-in?setup=complete'), 2000);
    } catch (err) {
      console.error('Phone setup error:', err);
      setError('Failed to complete account setup. Please try again.');
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'therapist': return 'Therapist';
      case 'org_admin': return 'Organization Administrator';
      case 'patient': return 'Patient';
      default: return role;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 bg-gradient-to-r from-purple-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              StoryCare
            </h1>
          </Link>
          <p className="text-gray-600">Set Up Your Account</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          )}

          {/* Error banner */}
          {error && step !== 'error' && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Error state */}
          {step === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Something Went Wrong</h2>
              <p className="mb-6 text-gray-600">{error}</p>
              <Link href="/sign-in">
                <Button variant="secondary" className="w-full">Go to Sign In</Button>
              </Link>
            </div>
          )}

          {/* Step 1: Enter phone */}
          {step === 'enter-phone' && (
            <div>
              <div className="mb-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                  <Phone className="h-8 w-8 text-purple-600" />
                </div>
                <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                  Phone Verification
                </h2>
                <p className="text-center text-gray-600">
                  Enter the phone number associated with your invitation to receive a verification code.
                </p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <Input
                  type="tel"
                  label="Phone Number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="+1 555 000 0000"
                  required
                  disabled={loading}
                  helperText="Include country code e.g. +1"
                />
                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  Send Verification Code
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

            </div>
          )}

          {/* Step 2: Confirm invitation */}
          {step === 'confirm-invitation' && invitation && (
            <div>
              <div className="mb-6">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm">
                  <p className="font-medium text-blue-900">Invitation found</p>
                  <p className="mt-1 text-blue-700">
                    We found an invitation for
                    {' '}
                    <strong>{invitation.email}</strong>
                    {invitation.organizationName && (
                      <>
                        {' '}
                        at
                        {' '}
                        <strong>{invitation.organizationName}</strong>
                      </>
                    )}
                    .
                  </p>
                  <p className="mt-1 text-blue-700">
                    Role:
                    {' '}
                    <strong>{getRoleDisplay(invitation.role)}</strong>
                  </p>
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  Is this your account? We'll send a verification code to
                  {' '}
                  <strong>{maskPhone(phone)}</strong>
                  .
                </p>
              </div>
              <Button variant="primary" className="w-full" onClick={() => setStep('phone-otp')}>
                Send Verification Code
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setStep('enter-phone');
                  setInvitation(null);
                  setError('');
                }}
              >
                Use a different number
              </button>
            </div>
          )}

          {/* Step 3: Phone OTP */}
          {step === 'phone-otp' && (
            <div>
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">Verify Your Phone</h2>
                <p className="text-gray-600">Enter the code sent to your phone.</p>
              </div>

              <PhoneOtpVerifier
                phoneNumber={phone}
                phoneMasked={maskPhone(phone)}
                onSuccess={handleOtpSuccess}
                onCancel={() => {
                  setStep('enter-phone');
                  setError('');
                }}
              />
            </div>
          )}

          {/* Step 4: Create password */}
          {step === 'create-password' && invitation && (
            <div>
              <div className="mb-6">
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start">
                    <Check className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Phone verified!</p>
                      <p className="mt-1 text-green-700">
                        Welcome,
                        {' '}
                        <strong>{invitation.name}</strong>
                        ! You're joining as a
                        {' '}
                        <strong>{getRoleDisplay(invitation.role)}</strong>
                        {invitation.organizationName && (
                          <>
                            {' '}
                            at
                            {' '}
                            <strong>{invitation.organizationName}</strong>
                          </>
                        )}
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-900">Create Your Password</h2>
                <p className="text-gray-600">Choose a strong password for your account.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  value={invitation.email}
                  disabled
                  className="bg-gray-50"
                />

                <Input
                  type="password"
                  label="Create Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading}
                  helperText="At least 6 characters"
                />

                <Input
                  type="password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                />

                <Button type="submit" variant="primary" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {/* Success */}
          {step === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Account Created!</h2>
              <p className="mb-6 text-gray-600">
                Your account is ready. Redirecting you to sign in...
              </p>
              <Link
                href="/sign-in?setup=complete"
                className="inline-block rounded-lg bg-purple-600 px-6 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupAccountPhonePage() {
  return (
    <Suspense fallback={(
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )}
    >
      <SetupAccountPhoneForm />
    </Suspense>
  );
}
