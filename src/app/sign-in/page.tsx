'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signIn } from '@/libs/Firebase';
import { humanizeFirebaseError } from '@/utils/FirebaseErrorMessages';

function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success message from setup-account
  useEffect(() => {
    if (searchParams.get('setup') === 'complete') {
      // Defer setState to avoid cascading renders
      queueMicrotask(() => {
        setSuccessMessage('Account created successfully! You can now sign in.');
      });
    }
  }, [searchParams]);

  // Mock accounts for testing
  const mockAccounts = [
    {
      email: 'zharfan@walturn.com',
      password: 'securepassword',
      role: 'Super Admin',
      color: 'bg-purple-100 text-purple-700 border-purple-300',
    },
    {
      email: 'zharfan@entryway.health',
      password: 'securepassword',
      role: 'Org Admin',
      color: 'bg-blue-100 text-blue-700 border-blue-300',
    },
    {
      email: 'ok632559@gmail.com',
      password: '',
      role: 'Therapist',
      color: 'bg-green-100 text-green-700 border-green-300',
    },
    {
      email: 'haloyah7@gmail.com',
      password: '',
      role: 'Patient',
      color: 'bg-orange-100 text-orange-700 border-orange-300',
    },
  ];

  const handleMockAccountClick = (mockEmail: string, mockPassword: string) => {
    setEmail(mockEmail);
    setPassword(mockPassword);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage(''); // Clear success message when submitting
    setLoading(true);

    const { user, error: signInError } = await signIn(email, password);

    if (signInError) {
      setError(humanizeFirebaseError(signInError));
      setLoading(false);
    } else if (user) {
      try {
        // Get the ID token and set session cookie
        const idToken = await user.getIdToken();
        const sessionResponse = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        });

        if (!sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          setError(sessionData.error || 'Failed to complete sign in. Please try again.');
          setLoading(false);
          return;
        }

        // Get the redirect URL from query params or default to dashboard
        const searchParams = new URLSearchParams(window.location.search);
        const redirect = searchParams.get('redirect') || '/dashboard';
        router.push(redirect);
      } catch (error) {
        console.error('Failed to set session:', error);
        setError('Failed to complete sign in. Please try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-white to-purple-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Image src="/logo.png" alt="StoryCare" width={48} height={48} />
            <h1 className="text-4xl font-bold text-purple-600">
              StoryCare
            </h1>
          </Link>
          <p className="mt-2 text-gray-600">Digital Narrative Therapy</p>
        </div>

        {/* Sign In Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Welcome back
          </h2>

          {successMessage && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Mock Test Accounts - Only shown in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 rounded-lg border-2 border-dashed border-yellow-300 bg-yellow-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-semibold text-yellow-800">
                  Test Accounts (Demo Only)
                </span>
              </div>
              <p className="mb-3 text-xs text-yellow-700">
                Click any account below to auto-fill credentials:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {mockAccounts.map(account => (
                  <button
                    key={`${account.email}-${account.role}`}
                    type="button"
                    onClick={() => handleMockAccountClick(account.email, account.password)}
                    className={`rounded-lg border-2 ${account.color} px-3 py-2 text-left transition-all hover:shadow-md active:scale-95`}
                  >
                    <div className="text-xs font-semibold">{account.role}</div>
                    <div className="mt-1 truncate text-xs opacity-75">
                      {account.email.split('@')[0]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(''); // Clear error when user types
              }}
              placeholder="your@email.com"
              required
            />

            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(''); // Clear error when user types
              }}
              placeholder="Enter your password"
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-700">
                <input type="checkbox" className="rounded" />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="font-medium text-purple-600 hover:text-purple-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
