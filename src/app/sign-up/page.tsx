/**
 * Organization Sign Up Page
 * For creating a NEW organization with the first org admin
 */

'use client';

import { ArrowLeft, ArrowRight, Building2, Check, Mail, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { signUp } from '@/libs/Firebase';

type Step = 1 | 2 | 3 | 4;

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [adminName, setAdminName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const router = useRouter();

  // Step 1: Email & Password
  const handleStep1Submit = async (e: React.FormEvent) => {
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

    // Create Firebase account with email verification
    const { user, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else if (user) {
      // Email verification sent automatically by signUp function
      setVerificationSent(true);
      setLoading(false);

      // Show info message about email verification
      setTimeout(() => {
        setCurrentStep(2);
      }, 3000); // Give user time to see the verification message
    }
  };

  // Step 2: Organization Info
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!organizationName.trim()) {
      setError('Organization name is required');
      return;
    }

    if (!contactEmail.trim()) {
      setError('Contact email is required');
      return;
    }

    setCurrentStep(3);
  };

  // Step 3: Admin Profile
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!adminName.trim()) {
      setError('Your name is required');
      return;
    }

    setLoading(true);

    try {
      // Get Firebase ID token
      const { auth } = await import('@/libs/Firebase');
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError('Authentication error. Please try again.');
        setLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Create organization with admin
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          email,
          adminName,
          organizationName,
          contactEmail,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Move to completion step
        setCurrentStep(4);
      } else {
        setError(data.error || 'Failed to create organization');
      }
    } catch (err) {
      setError('Failed to create organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Stepper Component
  const Stepper = () => {
    const steps = [
      { num: 1, label: 'Account' },
      { num: 2, label: 'Organization' },
      { num: 3, label: 'Profile' },
      { num: 4, label: 'Complete' },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.num} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition-colors ${
                    currentStep > step.num
                      ? 'border-purple-600 bg-purple-600 text-white'
                      : currentStep === step.num
                        ? 'border-purple-600 text-purple-600'
                        : 'border-gray-300 text-gray-300'
                  }`}
                >
                  {currentStep > step.num ? <Check className="h-5 w-5" /> : step.num}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    currentStep >= step.num ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 border-t-2 transition-colors ${
                    currentStep > step.num ? 'border-purple-600' : 'border-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
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
          <p className="text-gray-600">Create Your Organization</p>
        </div>

        {/* Sign Up Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <Stepper />

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {verificationSent && currentStep === 1 && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-start">
                <Mail className="mr-3 h-5 w-5 text-green-600" />
                <div className="text-sm text-green-700">
                  <p className="font-medium">Account Created!</p>
                  <p className="mt-1">
                    Your account has been created with
                    {' '}
                    <strong>{email}</strong>
                    .
                    Please continue to set up your organization.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Email & Password */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Create your account
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Start by creating your admin login credentials
                </p>
              </div>

              <Input
                type="email"
                label="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@yourcompany.com"
                required
              />

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Step 2: Organization Info */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Organization Details
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Tell us about your organization
                </p>
              </div>

              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-start">
                  <Building2 className="mr-3 h-5 w-5 text-purple-600" />
                  <div className="text-sm text-purple-700">
                    <p className="font-medium">New Organization</p>
                    <p className="mt-1">You'll be the first administrator</p>
                  </div>
                </div>
              </div>

              <Input
                type="text"
                label="Organization Name"
                value={organizationName}
                onChange={e => setOrganizationName(e.target.value)}
                placeholder="Your Organization"
                required
              />

              <Input
                type="email"
                label="Contact Email"
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="contact@yourcompany.com"
                required
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 3: Admin Profile */}
          {currentStep === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Your Profile
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Complete your administrator profile
                </p>
              </div>

              {/* Organization Confirmation */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start">
                  <Check className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Organization</p>
                    <p className="mt-1 text-green-700">{organizationName}</p>
                  </div>
                </div>
              </div>

              <Input
                type="text"
                label="Full Name"
                value={adminName}
                onChange={e => setAdminName(e.target.value)}
                placeholder="John Doe"
                required
              />

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-start">
                  <User className="mr-3 h-5 w-5 text-gray-600" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">Role: Organization Administrator</p>
                    <p className="mt-1 text-gray-600">Full access to manage your organization</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCurrentStep(2)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating...' : 'Create Organization'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Organization Created!
              </h2>
              <p className="mb-6 text-gray-600">
                Your organization has been successfully created. You can now access your dashboard and invite team members.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            </div>
          )}

          {/* Sign In Link */}
          {currentStep < 4 && (
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
          )}
        </div>
      </div>
    </div>
  );
}
