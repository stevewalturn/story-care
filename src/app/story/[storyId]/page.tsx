'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface StoryPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  videoUrl?: string;
  text: string;
  narrationAudioUrl?: string;
  backgroundMusicUrl?: string;
}

interface Story {
  id: string;
  patientName: string;
  title: string;
  description: string;
  coverImage: string;
  pages: StoryPage[];
  createdAt: Date;
}

export default function StoryViewPage({ params }: { params: Promise<{ storyId: string }> }) {
  const [story, setStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showCover, setShowCover] = useState(true);
  const [_storyId, setStoryId] = useState<string | null>(null);

  useEffect(() => {
    // Unwrap params Promise
    params.then(({ storyId: id }) => {
      setStoryId(id);
      // Fetch story data
      // In real implementation: fetch(`/api/stories/${id}`)
      // For now, use mock data
      setStory({
        id,
      patientName: 'Emma',
      title: 'Journey to Inner Peace',
      description: 'A story of resilience, growth, and discovering inner strength',
      coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
      pages: [
        {
          id: '1',
          pageNumber: 1,
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop',
          text: 'In a world of constant noise, Emma found herself searching for silence. Not the absence of sound, but the presence of peace.',
          narrationAudioUrl: '/audio/narration1.mp3',
          backgroundMusicUrl: '/audio/ambient1.mp3',
        },
        {
          id: '2',
          pageNumber: 2,
          imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&h=800&fit=crop',
          text: 'She began a journey through the forest of her mind, discovering paths she never knew existed.',
          narrationAudioUrl: '/audio/narration2.mp3',
        },
        {
          id: '3',
          pageNumber: 3,
          imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=800&fit=crop',
          text: 'Along the way, she learned that strength wasn\'t about never falling - it was about always getting back up.',
          narrationAudioUrl: '/audio/narration3.mp3',
        },
        {
          id: '4',
          pageNumber: 4,
          videoUrl: '/videos/healing-journey.mp4',
          imageUrl: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1200&h=800&fit=crop',
          text: 'With each step, she grew stronger. The mountain that once seemed impossible now felt conquerable.',
          narrationAudioUrl: '/audio/narration4.mp3',
        },
        {
          id: '5',
          pageNumber: 5,
          imageUrl: 'https://images.unsplash.com/photo-1495615080073-6b89c9839ce0?w=1200&h=800&fit=crop',
          text: 'And when she finally reached the summit, she realized the view was beautiful - not just outside, but within.',
          narrationAudioUrl: '/audio/narration5.mp3',
        },
      ],
      createdAt: new Date(2025, 9, 20),
      });
    });
  }, [params]);

  if (!story) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading your story...</p>
        </div>
      </div>
    );
  }

  const currentPage = story.pages[currentPageIndex];
  const totalPages = story.pages.length;

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const startStory = () => {
    setShowCover(false);
    setIsPlaying(true);
  };

  if (showCover) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Cover Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${story.coverImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/80" />
        </div>

        {/* Cover Content */}
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-white px-4">
          <div className="max-w-3xl text-center space-y-6">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium mb-4">
              A Story Created for You
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4 leading-tight">
              {story.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8">
              {story.description}
            </p>
            <Button
              variant="primary"
              onClick={startStory}
              className="px-8 py-4 text-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Begin Your Journey
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Story Page */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Background Media */}
        {currentPage.videoUrl ? (
          <video
            key={currentPage.id}
            src={currentPage.videoUrl}
            autoPlay
            loop
            muted={isMuted}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${currentPage.imageUrl})` }}
          />
        )}

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/80" />

        {/* Text Content */}
        <div className="relative z-10 max-w-4xl px-8 text-center">
          <p className="text-2xl md:text-4xl text-white font-serif leading-relaxed drop-shadow-2xl">
            {currentPage.text}
          </p>
        </div>

        {/* Navigation Controls */}
        <div className="absolute bottom-8 left-0 right-0 z-20">
          <div className="max-w-4xl mx-auto px-8">
            {/* Progress Bar */}
            <div className="mb-6">
              <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-1">
                <div
                  className="bg-white h-1 rounded-full transition-all duration-300"
                  style={{ width: `${((currentPageIndex + 1) / totalPages) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-white/80 text-sm">
                <span>Page {currentPageIndex + 1} of {totalPages}</span>
                <span>{story.title}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={goToPreviousPage}
                disabled={currentPageIndex === 0}
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-colors flex items-center justify-center text-white"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>

              <Button
                variant="ghost"
                onClick={goToNextPage}
                disabled={currentPageIndex === totalPages - 1}
                className="text-white hover:bg-white/20 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* Keyboard Navigation Hint */}
        <div className="absolute top-8 right-8 text-white/60 text-sm backdrop-blur-sm bg-black/20 px-4 py-2 rounded-lg">
          Use ← → arrow keys to navigate
        </div>
      </div>

      {/* Keyboard Navigation */}
      <div
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') goToNextPage();
          if (e.key === 'ArrowLeft') goToPreviousPage();
          if (e.key === ' ') setIsPlaying(!isPlaying);
        }}
        className="sr-only"
      >
        Keyboard navigation enabled
      </div>
    </div>
  );
}
