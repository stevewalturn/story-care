'use client';

import { ArrowLeft, Mail } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resetPassword } from '@/libs/Firebase';
import { humanizeFirebaseError } from '@/utils/FirebaseErrorMessages';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(humanizeFirebaseError(resetError));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
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
          <p className="mt-2 text-gray-600">Digital Therapeutic Platform</p>
        </div>

        {/* Forgot Password Card */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          {success ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Check your email
              </h2>
              <p className="mb-6 text-gray-600">
                We've sent a password reset link to
                {' '}
                <span className="font-medium text-gray-900">{email}</span>
              </p>
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-left text-sm text-green-700">
                <p className="mb-2 font-medium">Next steps:</p>
                <ol className="list-inside list-decimal space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the reset link in the email</li>
                  <li>Create a new password</li>
                </ol>
              </div>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 font-medium text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            // Form State
            <>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Forgot your password?
              </h2>
              <p className="mb-6 text-gray-600">
                No worries! Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="email"
                  label="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="your@email.com"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 font-medium text-purple-600 hover:text-purple-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
