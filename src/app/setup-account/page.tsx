/**
 * Setup Account Page
 * For invited users to create their password and activate their account
 * Supports token-based flow (preferred) and email-based flow (fallback)
 */

'use client';

import { AlertCircle, ArrowRight, Check, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUp } from '@/libs/Firebase';
import { humanizeFirebaseError } from '@/utils/FirebaseErrorMessages';

type Step = 'loading' | 'email' | 'password' | 'success' | 'error';

type InvitationDetails = {
  name: string;
  email: string;
  role: string;
  organizationName: string;
  expiresAt?: string;
};

type ErrorState = {
  message: string;
  type: 'expired' | 'invalid' | 'already_activated' | 'generic';
};

function SetupAccountForm() {
  const [currentStep, setCurrentStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState('');
  const [errorState, setErrorState] = useState<ErrorState | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // On mount, check for token in URL and validate it
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const urlEmail = searchParams.get('email');

    if (urlToken) {
      setToken(urlToken);
      validateToken(urlToken);
    } else if (urlEmail) {
      // Fallback to email-based flow for backward compatibility
      setEmail(urlEmail);
      setCurrentStep('email');
    } else {
      setCurrentStep('email');
    }
  }, [searchParams]);

  // Validate invitation token
  const validateToken = async (tokenToValidate: string) => {
    try {
      const response = await fetch('/api/auth/validate-invitation-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenToValidate }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        // Valid token - set invitation details and skip to password step
        setInvitation({
          name: data.name,
          email: data.email,
          role: data.role,
          organizationName: data.organizationName,
          expiresAt: data.expiresAt,
        });
        setEmail(data.email);
        setCurrentStep('password');
      } else if (response.status === 410) {
        // Token already used
        setErrorState({
          message: data.error || 'This invitation has already been used.',
          type: 'already_activated',
        });
        setCurrentStep('error');
      } else if (response.status === 404 && data.expired) {
        // Token expired
        setErrorState({
          message: data.error || 'This invitation link has expired.',
          type: 'expired',
        });
        setCurrentStep('error');
      } else {
        // Invalid token
        setErrorState({
          message: data.error || 'Invalid invitation link.',
          type: 'invalid',
        });
        setCurrentStep('error');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setErrorState({
        message: 'Failed to validate invitation. Please try again.',
        type: 'generic',
      });
      setCurrentStep('error');
    }
  };

  // Step 1: Verify email has invitation (fallback flow)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/check-invitation?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok && data.status === 'pending' && data.exists) {
        // Valid pending invitation found
        setInvitation(data);
        setCurrentStep('password');
      } else if (response.ok && data.status === 'already_activated') {
        // Account already activated
        setError(
          'This account has already been activated. Please sign in instead.',
        );
        // Optionally redirect to sign-in after a delay
        setTimeout(() => {
          router.push('/sign-in?message=already_activated');
        }, 2000);
      } else {
        // No invitation found or other error
        setError(
          data.error || 'No invitation found for this email. Please contact your therapist or administrator.',
        );
      }
    } catch {
      setError('Failed to verify invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create password and Firebase account
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase account (without email verification)
      const { user, error: signUpError } = await signUp(email, password);

      if (signUpError) {
        // Check if account already exists
        if (signUpError.code === 'auth/email-already-in-use') {
          // Firebase account exists - try to link it to database
          setError('Account already exists. Attempting to link...');

          // Try to sign in to get the ID token
          try {
            const { signIn } = await import('@/libs/Firebase');
            const { user: existingUser, error: signInError } = await signIn(email, password);

            if (signInError || !existingUser) {
              setError('This email is already registered. Please sign in or use a different email.');
              setLoading(false);
              return;
            }

            // Try to link the existing Firebase account
            const idToken = await existingUser.getIdToken();
            const linkResponse = await fetch('/api/auth/link-firebase-uid', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
              body: JSON.stringify({ email, token }),
            });

            const linkData = await linkResponse.json();

            if (!linkResponse.ok) {
              console.error('Failed to link existing Firebase account:', linkData);
              setError(linkData.error || 'This email is already registered. Please sign in instead.');
              setLoading(false);
              return;
            }

            // Successfully linked existing account
            console.log('Account linked and activated:', linkData);
            setCurrentStep('success');
            setTimeout(() => {
              router.push('/sign-in?setup=complete');
            }, 2000);
            return;
          } catch (recoveryError) {
            console.error('Failed to recover existing account:', recoveryError);
            setError('This email is already registered. Please sign in instead.');
            setLoading(false);
            return;
          }
        }

        setError(humanizeFirebaseError(signUpError));
        setLoading(false);
        return;
      }

      if (user) {
        // Link Firebase UID to invited user account
        try {
          const idToken = await user.getIdToken();
          const linkResponse = await fetch('/api/auth/link-firebase-uid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
            body: JSON.stringify({ email, token }),
          });

          const linkData = await linkResponse.json();

          if (!linkResponse.ok) {
            console.error('Failed to link Firebase UID:', linkData);

            // Provide specific error messages based on status code
            if (linkResponse.status === 409) {
              // Conflict - account already activated or linked to different account
              setError(linkData.error || 'This account has already been activated. Please sign in.');
              setTimeout(() => {
                router.push('/sign-in');
              }, 2000);
            } else if (linkResponse.status === 404) {
              // No invitation found
              setError(linkData.error || 'No invitation found. Please contact your administrator.');
            } else if (linkResponse.status === 410) {
              // Token expired
              setError(linkData.error || 'Invitation has expired. Please request a new invitation.');
            } else {
              setError(linkData.error || 'Failed to activate account. Please try again or contact support.');
            }

            setLoading(false);
            return;
          }

          console.log('Account linked and activated:', linkData);
        } catch (linkError) {
          console.error('Error linking Firebase UID:', linkError);
          setError('Failed to complete account setup. Please try again or contact support.');
          setLoading(false);
          return;
        }

        // Success! Move to completion step
        setCurrentStep('success');

        // Wait a moment, then redirect to sign-in
        setTimeout(() => {
          router.push('/sign-in?setup=complete');
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error during account creation:', err);
      setError('Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'therapist':
        return 'Therapist';
      case 'org_admin':
        return 'Organization Administrator';
      case 'patient':
        return 'Patient';
      default:
        return role;
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

        {/* Setup Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {/* Loading State */}
          {currentStep === 'loading' && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <p className="mt-4 text-gray-600">Validating your invitation...</p>
            </div>
          )}

          {/* Error State */}
          {currentStep === 'error' && errorState && (
            <div className="text-center">
              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                  errorState.type === 'expired' ? 'bg-orange-100' : 'bg-red-100'
                }`}
              >
                {errorState.type === 'expired' ? (
                  <Clock className="h-8 w-8 text-orange-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {errorState.type === 'expired' && 'Invitation Expired'}
                {errorState.type === 'already_activated' && 'Already Activated'}
                {errorState.type === 'invalid' && 'Invalid Invitation'}
                {errorState.type === 'generic' && 'Something Went Wrong'}
              </h2>
              <p className="mb-6 text-gray-600">
                {errorState.message}
              </p>

              {errorState.type === 'already_activated' ? (
                <Link href="/sign-in">
                  <Button variant="primary" className="w-full">
                    Go to Sign In
                  </Button>
                </Link>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">
                    Please contact your administrator to request a new invitation.
                  </p>
                  <Link href="/sign-in">
                    <Button variant="secondary" className="w-full">
                      Go to Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {error && currentStep !== 'error' && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Email Verification (fallback when no token) */}
          {currentStep === 'email' && (
            <div>
              <div className="mb-6">
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Welcome!
                </h2>
                <p className="text-gray-600">
                  You've been invited to join StoryCare. Let's create your password.
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  placeholder="Enter the email you were invited with"
                  required
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Checking...' : 'Continue'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-600">
                Already have an account?
                {' '}
                <Link
                  href="/sign-in"
                  className="font-medium text-purple-600 hover:text-purple-700"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Password Creation */}
          {currentStep === 'password' && invitation && (
            <div>
              <div className="mb-6">
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start">
                    <Check className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Invitation verified!</p>
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
                      </p>
                    </div>
                  </div>
                </div>

                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Create Your Password
                </h2>
                <p className="text-gray-600">
                  Choose a strong password for your account
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email Address"
                  value={email}
                  disabled
                  className="bg-gray-50"
                />

                <Input
                  type="password"
                  label="Create Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Clear error when user types
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
                    setError(''); // Clear error when user types
                  }}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Create Account & Sign In'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </div>
          )}

          {/* Step 3: Success */}
          {currentStep === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Account Created!
              </h2>
              <p className="mb-6 text-gray-600">
                Your account has been set up successfully. Redirecting you to sign in...
              </p>
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Footer Links */}
        {currentStep === 'email' && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Already have an account?</p>
            <Link
              href="/sign-in"
              className="font-medium text-purple-600 hover:text-purple-700"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SetupAccountPage() {
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
      <SetupAccountForm />
    </Suspense>
  );
}
