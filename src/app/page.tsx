import { Brain, Heart, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
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
                className="rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
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
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            AI-Powered Narrative Therapy Platform
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold text-gray-900 sm:text-6xl">
            Transform Therapy Sessions into
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {' '}
              Healing Stories
            </span>
          </h1>

          <p className="mb-8 text-xl leading-relaxed text-gray-600">
            StoryCare helps therapists create powerful narrative experiences for patients
            using AI-powered transcription, analysis, and multimedia storytelling.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="transform rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl"
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

        {/* Hero Image/Demo */}
        <div className="relative mt-16">
          <div className="aspect-video overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 shadow-2xl">
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600">
                  <Sparkles className="h-10 w-10 text-white" />
                </div>
                <p className="text-lg text-white">Platform Dashboard Preview</p>
                <p className="mt-2 text-sm text-gray-400">Coming Soon</p>
              </div>
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
            Powerful tools to transform therapy sessions into meaningful patient experiences
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              AI-Powered Transcription
            </h3>
            <p className="text-gray-600">
              Automatically transcribe therapy sessions with speaker identification and timestamps using Deepgram AI.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <Sparkles className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Intelligent Analysis
            </h3>
            <p className="text-gray-600">
              GPT-4 analyzes transcripts to identify themes, extract meaningful quotes, and suggest narrative elements.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-pink-100">
              <Heart className="h-6 w-6 text-pink-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Visual Storytelling
            </h3>
            <p className="text-gray-600">
              Generate therapeutic images with DALL-E 3 and assemble video scenes to create powerful patient narratives.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Patient Engagement
            </h3>
            <p className="text-gray-600">
              Track patient interactions, reflections, and survey responses to measure therapeutic progress.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              HIPAA Compliant
            </h3>
            <p className="text-gray-600">
              Secure storage with Google Cloud, encrypted data, and compliance with healthcare privacy regulations.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-lg transition-shadow hover:shadow-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Zap className="h-6 w-6 text-indigo-600" />
            </div>
            <h3 className="mb-3 text-xl font-semibold text-gray-900">
              Fast & Efficient
            </h3>
            <p className="text-gray-600">
              Built with Next.js 16 and modern tools for lightning-fast performance and seamless user experience.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-12 text-center shadow-2xl">
          <h2 className="mb-4 text-4xl font-bold text-white">
            Ready to Transform Your Practice?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-indigo-100">
            Join therapists who are creating powerful healing narratives with StoryCare
          </p>
          <Link
            href="/sign-up"
            className="inline-block transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-xl"
          >
            Start Your Free Trial
          </Link>
          <p className="mt-4 text-sm text-indigo-200">
            14-day free trial • No credit card required
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900">StoryCare</span>
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
