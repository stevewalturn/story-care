import { BookOpen, Clock, FileText, Heart, Shield, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="StoryCare" width={32} height={32} />
              <span className="text-xl font-bold text-purple-600">
                StoryCare
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-700 hover:to-teal-600 hover:shadow-xl"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-medium text-teal-700">
            <Heart className="h-4 w-4" />
            Digital Narrative Therapy Platform
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 sm:text-6xl">
            Help Your Patients
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {' '}
              Reframe Their Stories
            </span>
          </h1>

          <p className="mb-8 text-xl leading-relaxed text-gray-600">
            StoryCare helps therapists save time on documentation while creating
            engaging, personalized content that supports patient healing and growth.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="transform rounded-xl bg-gradient-to-r from-blue-600 to-teal-500 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-blue-700 hover:to-teal-600 hover:shadow-xl"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow-md"
            >
              Learn More
            </Link>
          </div>

          <p className="mt-4 text-sm text-gray-500">
            No credit card required • HIPAA compliant • 14-day free trial
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="relative mt-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Highlight 1 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Streamlined Documentation
              </h3>
              <p className="text-sm text-gray-600">
                Capture and organize session notes efficiently with automated transcription
              </p>
            </div>

            {/* Highlight 2 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                <BookOpen className="h-5 w-5 text-teal-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Narrative Content
              </h3>
              <p className="text-sm text-gray-600">
                Create personalized stories and visuals to support therapeutic goals
              </p>
            </div>

            {/* Highlight 3 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Patient Engagement
              </h3>
              <p className="text-sm text-gray-600">
                Track progress and responses to understand what resonates with each patient
              </p>
            </div>

            {/* Highlight 4 */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">
                Save Time
              </h3>
              <p className="text-sm text-gray-600">
                Reduce administrative burden so you can focus on what matters most
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900">
            Everything You Need for Narrative Therapy
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Professional tools designed to support your therapeutic practice
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Effortless Documentation
            </h3>
            <p className="text-gray-600">
              Automatically transcribe therapy sessions with speaker identification,
              reducing time spent on note-taking and paperwork.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50">
              <BookOpen className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Clinical Insights
            </h3>
            <p className="text-gray-600">
              Extract meaningful themes and quotes from sessions to identify patterns
              and support treatment planning.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-50">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Patient-Centered Media
            </h3>
            <p className="text-gray-600">
              Create therapeutic images and video content that help patients visualize
              and engage with their healing journey.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Progress Tracking
            </h3>
            <p className="text-gray-600">
              Monitor patient interactions and feedback to measure engagement and
              adjust therapeutic approaches.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              HIPAA Compliant
            </h3>
            <p className="text-gray-600">
              Secure, encrypted storage that meets healthcare privacy standards and
              protects patient information.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Time-Saving Design
            </h3>
            <p className="text-gray-600">
              Intuitive interface designed for busy therapists, with fast workflows
              and easy-to-use tools.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-blue-600 to-teal-500 p-12 text-center shadow-2xl">
          <h2 className="mb-4 text-4xl font-bold text-white">
            Ready to Transform Your Practice?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-50">
            Join therapists who are creating meaningful therapeutic experiences with StoryCare
          </p>
          <Link
            href="/sign-up"
            className="inline-block transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl"
          >
            Start Your Free Trial
          </Link>
          <p className="mt-4 text-sm text-blue-100">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="StoryCare" width={24} height={24} />
              <span className="font-semibold text-purple-600">StoryCare</span>
            </div>
            <p className="text-sm text-gray-600">
              © 2025 StoryCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
