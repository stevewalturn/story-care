'use client';

import { ArrowRight, BookOpen, CheckCircle2, Clock, FileText, Heart, Shield, Sparkles, Users, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsLoaded(true);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-white to-violet-50" />
        <div
          className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-purple-200/40 blur-[120px] transition-transform duration-1000"
          style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
        />
        <div
          className="absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-violet-200/30 blur-[100px] transition-transform duration-1000"
          style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5MzMzZWEiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
      </div>

      {/* Header */}
      <header className={`fixed top-0 right-0 left-0 z-50 transition-all duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-2xl border border-purple-100 bg-white/80 px-6 py-3 shadow-lg shadow-purple-500/5 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-purple-400/30 blur-md" />
                <Image src="/logo.png" alt="StoryCare" width={36} height={36} className="relative" />
              </div>
              <span className="text-xl font-bold text-purple-600">
                StoryCare
              </span>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-4">
              <Link
                href="/sign-in"
                className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-purple-600"
              >
                Sign in
              </Link>
              <Link
                href="/sign-in"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/40"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated Badge */}
            <div className={`mb-8 transition-all delay-200 duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <div className="group inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-5 py-2.5 text-sm font-medium text-purple-700 transition-all hover:border-purple-300 hover:bg-purple-100">
                <Sparkles className="h-4 w-4 animate-pulse text-purple-500" />
                <span>AI-Powered Narrative Therapy Platform</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Main Heading with Animation */}
            <h1 className={`mb-8 transition-all delay-300 duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <span className="block text-5xl leading-tight font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
                Transform Lives Through
              </span>
              <span className="relative mt-2 block">
                <span className="animate-gradient-shift bg-gradient-to-r from-purple-600 via-violet-500 to-purple-600 bg-[length:200%_auto] bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
                  Powerful Stories
                </span>
                {/* Animated underline */}
                <svg className="absolute -bottom-2 left-1/2 h-3 w-64 -translate-x-1/2 sm:w-80" viewBox="0 0 200 12" preserveAspectRatio="none">
                  <path
                    d="M0,8 Q50,0 100,8 T200,8"
                    stroke="url(#landing-gradient)"
                    strokeWidth="3"
                    fill="none"
                    className="animate-draw-line"
                    strokeDasharray="200"
                    strokeDashoffset="200"
                  />
                  <defs>
                    <linearGradient id="landing-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333ea" />
                      <stop offset="50%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#9333ea" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            {/* Subheading */}
            <p className={`mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-gray-600 transition-all delay-400 duration-700 sm:text-xl ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              StoryCare empowers therapists to create personalized, AI-generated therapeutic content that helps patients visualize healing and growth.
            </p>

            {/* CTA Button */}
            <div className={`flex items-center justify-center transition-all delay-500 duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              <Link
                href="/sign-in"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-violet-600 px-10 py-5 text-lg font-semibold text-white shadow-2xl shadow-purple-500/30 transition-all hover:-translate-y-1 hover:shadow-purple-500/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-700 to-violet-700 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </Link>
            </div>

            {/* Trust Badges */}
            <div className={`mt-12 flex flex-wrap items-center justify-center gap-8 transition-all delay-600 duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
              {[
                { icon: Shield, text: 'HIPAA Compliant', color: 'text-green-500' },
                { icon: Zap, text: '14-Day Free Trial', color: 'text-amber-500' },
                { icon: Heart, text: 'No Credit Card', color: 'text-pink-500' },
              ].map(badge => (
                <div
                  key={badge.text}
                  className="flex items-center gap-2 text-sm text-gray-500"
                >
                  <badge.icon className={`h-4 w-4 ${badge.color}`} />
                  {badge.text}
                </div>
              ))}
            </div>
          </div>

          {/* Floating Feature Cards */}
          <div className={`relative mt-24 transition-all delay-700 duration-1000 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: FileText,
                  title: 'Smart Documentation',
                  description: 'AI transcription with speaker identification',
                },
                {
                  icon: BookOpen,
                  title: 'Narrative Content',
                  description: 'Personalized therapeutic stories & visuals',
                },
                {
                  icon: Users,
                  title: 'Patient Engagement',
                  description: 'Track progress and meaningful responses',
                },
                {
                  icon: Clock,
                  title: 'Save Hours Weekly',
                  description: 'Focus on patients, not paperwork',
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white p-6 shadow-lg shadow-purple-500/5 transition-all duration-500 hover:-translate-y-2 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                    <div className="mb-4 inline-flex rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 p-3 shadow-lg shadow-purple-500/25 transition-transform group-hover:scale-110">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-gray-900">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className={`absolute bottom-10 left-1/2 -translate-x-1/2 transition-all delay-1000 duration-700 ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-gray-400">Scroll to explore</span>
            <div className="h-14 w-8 rounded-full border border-purple-200 bg-white p-2 shadow-sm">
              <div className="h-3 w-full animate-bounce rounded-full bg-purple-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-3xl border border-purple-100 bg-gradient-to-br from-purple-50 to-violet-50 p-8 shadow-lg sm:grid-cols-3">
            {[
              { value: '500+', label: 'Therapists Trust Us' },
              { value: '10,000+', label: 'Stories Created' },
              { value: '95%', label: 'Time Saved on Docs' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="mb-2 bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
              <Sparkles className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Everything You Need for
              <span className="block bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
                Narrative Therapy
              </span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Professional tools designed by therapists, for therapists
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: FileText,
                title: 'Effortless Documentation',
                description: 'Automatically transcribe therapy sessions with speaker identification, reducing time spent on note-taking.',
                features: ['AI Transcription', 'Speaker Detection', 'Auto-formatting'],
              },
              {
                icon: BookOpen,
                title: 'Clinical Insights',
                description: 'Extract meaningful themes and quotes from sessions to identify patterns and support treatment planning.',
                features: ['Theme Extraction', 'Quote Highlights', 'Pattern Analysis'],
              },
              {
                icon: Heart,
                title: 'Patient-Centered Media',
                description: 'Create therapeutic images and video content that help patients visualize their healing journey.',
                features: ['AI Image Generation', 'Video Creation', 'Custom Visuals'],
              },
              {
                icon: Users,
                title: 'Progress Tracking',
                description: 'Monitor patient interactions and feedback to measure engagement and adjust therapeutic approaches.',
                features: ['Engagement Metrics', 'Response Tracking', 'Progress Reports'],
              },
              {
                icon: Shield,
                title: 'HIPAA Compliant',
                description: 'Secure, encrypted storage that meets healthcare privacy standards and protects patient information.',
                features: ['End-to-End Encryption', 'Audit Logs', 'Access Controls'],
              },
              {
                icon: Zap,
                title: 'Time-Saving Design',
                description: 'Intuitive interface designed for busy therapists, with fast workflows and easy-to-use tools.',
                features: ['Quick Actions', 'Templates', 'Batch Processing'],
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative overflow-hidden rounded-3xl border border-purple-100 bg-white p-8 shadow-lg shadow-purple-500/5 transition-all duration-500 hover:-translate-y-2 hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/10"
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-br from-purple-50 via-transparent to-violet-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  <div className="mb-6 inline-flex rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100 p-4 ring-1 ring-purple-200 transition-all group-hover:from-purple-500 group-hover:to-violet-500 group-hover:ring-purple-300">
                    <Icon className="h-7 w-7 text-purple-600 transition-colors group-hover:text-white" />
                  </div>

                  <h3 className="mb-3 text-xl font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="mb-6 leading-relaxed text-gray-600">
                    {feature.description}
                  </p>

                  <div className="space-y-2">
                    {feature.features.map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                        <CheckCircle2 className="h-4 w-4 text-purple-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-purple-600 via-purple-700 to-violet-700 p-12 text-center shadow-2xl sm:p-20">
            {/* Animated background elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute top-0 left-1/4 h-64 w-64 animate-pulse rounded-full bg-white/10 blur-[100px]" />
              <div className="absolute right-1/4 bottom-0 h-64 w-64 animate-pulse rounded-full bg-white/10 blur-[100px]" style={{ animationDelay: '1s' }} />
            </div>

            <div className="relative">
              <h2 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Ready to Transform
                <span className="block text-purple-200">
                  Your Practice?
                </span>
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-purple-100">
                Join hundreds of therapists creating meaningful therapeutic experiences with StoryCare
              </p>
              <Link
                href="/sign-in"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-10 py-5 text-lg font-semibold text-purple-600 shadow-2xl transition-all hover:-translate-y-1 hover:shadow-white/25"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 -z-10 bg-gradient-to-r from-purple-50 to-violet-50 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
              <p className="mt-8 text-sm text-purple-200">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-purple-100 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="StoryCare" width={28} height={28} />
              <span className="text-lg font-semibold text-purple-600">
                StoryCare
              </span>
            </div>
            <p className="text-sm text-gray-500">
              © 2025 StoryCare. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
