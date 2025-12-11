/**
 * Setup Account Page
 * For invited users to create their password and activate their account
 */

'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUp } from '@/libs/Firebase';
import { humanizeFirebaseError } from '@/utils/FirebaseErrorMessages';

type Step = 1 | 2 | 3;

type InvitationDetails = {
  name: string;
  email: string;
  role: string;
  organizationName: string;
};

export default function SetupAccountPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Step 1: Verify email has invitation
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/check-invitation?email=${encodeURIComponent(email)}`);
      const data = await response.json();

      if (response.ok && data.exists) {
        setInvitation(data);
        setCurrentStep(2);
      } else {
        setError(
          data.error || 'No invitation found for this email. Please check with your organization admin or create a new organization instead.',
        );
      }
    } catch (err) {
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
      // Create Firebase account
      const { user, error: signUpError } = await signUp(email, password);

      if (signUpError) {
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
            body: JSON.stringify({ email }),
          });

          const linkData = await linkResponse.json();

          if (!linkResponse.ok) {
            console.error('Failed to link Firebase UID:', linkData);
            setError(linkData.error || 'Failed to activate account. Please contact support.');
            setLoading(false);
            return;
          }

          console.log('✅ Account linked and activated:', linkData);
        } catch (linkError) {
          console.error('Error linking Firebase UID:', linkError);
          setError('Failed to complete account setup. Please contact support.');
          setLoading(false);
          return;
        }

        // Success! Move to completion step
        setCurrentStep(3);

        // Wait a moment, then redirect to sign-in
        setTimeout(() => {
          router.push('/sign-in?setup=complete');
        }, 2000);
      }
    } catch (err) {
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              StoryCare
            </h1>
          </Link>
          <p className="text-gray-600">Set Up Your Account</p>
        </div>

        {/* Setup Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Email Verification */}
          {currentStep === 1 && (
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
                  className="font-medium text-indigo-600 hover:text-indigo-700"
                >
                  Sign in
                </Link>
              </div>
            </div>
          )}

          {/* Step 2: Password Creation */}
          {currentStep === 2 && invitation && (
            <div>
              <div className="mb-6">
                <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-start">
                    <Check className="mt-0.5 mr-3 h-5 w-5 flex-shrink-0 text-green-600" />
                    <div className="text-sm">
                      <p className="font-medium text-green-900">Found your invitation!</p>
                      <p className="mt-1 text-green-700">
                        You're joining as a
                        {' '}
                        <strong>{getRoleDisplay(invitation.role)}</strong>
                        {' '}
                        at
                        {' '}
                        <strong>{invitation.organizationName}</strong>
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
          {currentStep === 3 && (
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
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            </div>
          )}
        </div>

        {/* Footer Links */}
        {currentStep === 1 && (
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Don't have an invitation?</p>
            <Link
              href="/sign-up"
              className="font-medium text-indigo-600 hover:text-indigo-700"
            >
              Create a new organization instead
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
