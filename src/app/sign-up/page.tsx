/**
 * Multi-Step Sign Up Page
 * Organization-based signup with role selection
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Building2, ArrowLeft, ArrowRight, User, Users } from 'lucide-react';
import { signUp } from '@/libs/Firebase';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Step = 1 | 2 | 3 | 4;
type Role = 'therapist' | 'patient';

interface OrganizationInfo {
  id: string;
  name: string;
  logoUrl: string | null;
}

export default function SignUpPage() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationCode, setOrganizationCode] = useState('');
  const [organization, setOrganization] = useState<OrganizationInfo | null>(null);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('therapist');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

    // Create Firebase account
    const { user, error: signUpError } = await signUp(email, password);

    if (signUpError) {
      setError(signUpError);
      setLoading(false);
    } else if (user) {
      // Move to next step
      setCurrentStep(2);
      setLoading(false);
    }
  };

  // Step 2: Organization Code
  const handleVerifyCode = async () => {
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/organizations/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: organizationCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok && data.valid) {
        setOrganization(data.organization);
        setCurrentStep(3);
      } else {
        setError(data.error || 'Invalid organization code');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Name & Role Selection
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get Firebase ID token
      const { auth } = await import('@/libs/Firebase');
      const currentUser = auth.currentUser;

      if (!currentUser || !organization) {
        setError('Authentication error. Please try again.');
        setLoading(false);
        return;
      }

      const idToken = await currentUser.getIdToken();

      // Complete registration
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firebaseUid: currentUser.uid,
          name,
          email,
          organizationId: organization.id,
          role,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Success! Move to final step
        setCurrentStep(4);
      } else {
        setError(data.error || 'Failed to complete registration');
      }
    } catch (err) {
      setError('Failed to complete registration. Please try again.');
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
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : currentStep === step.num
                        ? 'border-indigo-600 text-indigo-600'
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
                    currentStep > step.num ? 'border-indigo-600' : 'border-gray-300'
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-block">
            <h1 className="mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-4xl font-bold text-transparent">
              StoryCare
            </h1>
          </Link>
          <p className="text-gray-600">Digital Therapeutic Platform</p>
        </div>

        {/* Sign Up Form */}
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <Stepper />

          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
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
                  Start by creating your login credentials
                </p>
              </div>

              <Input
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />

              <Input
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
              />

              <Input
                type="password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Step 2: Organization Code */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Join your organization
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Enter the organization code provided by your administrator
                </p>
              </div>

              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                <div className="flex items-start">
                  <Building2 className="mr-3 h-5 w-5 text-indigo-600" />
                  <div className="text-sm text-indigo-700">
                    <p className="font-medium">Organization Code Format</p>
                    <p className="mt-1">Example: HEAL-WATERS-2025</p>
                  </div>
                </div>
              </div>

              <Input
                type="text"
                label="Organization Code"
                value={organizationCode}
                onChange={(e) => setOrganizationCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXXX-XXXX"
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
                  type="button"
                  variant="primary"
                  onClick={handleVerifyCode}
                  disabled={loading || !organizationCode}
                  className="flex-1"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Name & Role Selection */}
          {currentStep === 3 && organization && (
            <form onSubmit={handleStep3Submit} className="space-y-4">
              <div>
                <h2 className="mb-2 text-2xl font-bold text-gray-900">
                  Complete your profile
                </h2>
                <p className="mb-6 text-sm text-gray-600">
                  Tell us a bit about yourself
                </p>
              </div>

              {/* Organization Confirmation */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <div className="flex items-start">
                  <Check className="mr-3 h-5 w-5 text-green-600" />
                  <div className="text-sm">
                    <p className="font-medium text-green-900">Organization Verified</p>
                    <p className="mt-1 text-green-700">{organization.name}</p>
                  </div>
                </div>
              </div>

              <Input
                type="text"
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  I am a...
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setRole('therapist')}
                    className={`flex w-full items-center rounded-lg border-2 p-4 transition-colors ${
                      role === 'therapist'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <User className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Therapist</p>
                      <p className="text-xs text-gray-500">
                        Clinical professional providing therapy
                      </p>
                    </div>
                    {role === 'therapist' && (
                      <Check className="ml-auto h-5 w-5 text-indigo-600" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('patient')}
                    className={`flex w-full items-center rounded-lg border-2 p-4 transition-colors ${
                      role === 'patient'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <Users className="mr-3 h-5 w-5" />
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Patient</p>
                      <p className="text-xs text-gray-500">
                        Receiving therapeutic services
                      </p>
                    </div>
                    {role === 'patient' && (
                      <Check className="ml-auto h-5 w-5 text-indigo-600" />
                    )}
                  </button>
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
                  disabled={loading || !name}
                  className="flex-1"
                >
                  {loading ? 'Completing...' : 'Complete Signup'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 4: Success / Pending Approval */}
          {currentStep === 4 && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Registration Complete!
              </h2>
              <p className="mb-6 text-gray-600">
                Your account has been created and is now pending approval from your organization administrator.
              </p>
              <Button
                variant="primary"
                onClick={() => router.push('/pending-approval')}
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Sign In Link */}
          {currentStep < 4 && (
            <div className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/sign-in"
                className="font-medium text-indigo-600 hover:text-indigo-700"
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
