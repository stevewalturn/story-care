'use client';

import { useEffect, useRef } from 'react';

type AudioVisualizerProps = {
  analyser: AnalyserNode | null;
  isActive: boolean;
  variant?: 'light' | 'dark';
  className?: string;
};

const BAR_COUNT = 32;
const BAR_GAP = 2;

export function AudioVisualizer({
  analyser,
  isActive,
  variant = 'light',
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initialize data array when analyser is available
    if (analyser && !dataArrayRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    }

    const draw = () => {
      if (!ctx || !canvas) return;

      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate bar dimensions
      const totalBarWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;
      const barWidth = Math.max(2, totalBarWidth);

      // Get frequency data if available and active
      const values: number[] = Array.from({ length: BAR_COUNT }).fill(0) as number[];

      if (analyser && dataArrayRef.current && isActive) {
        analyser.getByteFrequencyData(dataArrayRef.current);

        // Sample the frequency data to get our bar values
        const step = Math.floor(analyser.frequencyBinCount / BAR_COUNT);
        for (let i = 0; i < BAR_COUNT; i++) {
          // Average a few bins for smoother visualization
          let sum = 0;
          for (let j = 0; j < step; j++) {
            sum += dataArrayRef.current[i * step + j] || 0;
          }
          values[i] = sum / step / 255; // Normalize to 0-1
        }
      }

      // Draw bars
      for (let i = 0; i < BAR_COUNT; i++) {
        const x = i * (barWidth + BAR_GAP);
        const normalizedValue = values[i] ?? 0;

        // Minimum bar height for visual feedback even when silent
        const minHeight = 3;
        const maxBarHeight = height - 4; // Leave some padding
        const barHeight = Math.max(minHeight, normalizedValue * maxBarHeight);

        // Create gradient based on amplitude
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);

        if (variant === 'dark') {
          // Dark theme (white/blue tones for dark backgrounds)
          if (normalizedValue > 0.7) {
            gradient.addColorStop(0, 'rgba(255, 100, 100, 0.9)'); // Red for high
            gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.9)'); // Yellow
            gradient.addColorStop(1, 'rgba(100, 255, 150, 0.9)'); // Green
          } else if (normalizedValue > 0.4) {
            gradient.addColorStop(0, 'rgba(255, 200, 100, 0.8)'); // Yellow
            gradient.addColorStop(1, 'rgba(100, 255, 150, 0.8)'); // Green
          } else {
            gradient.addColorStop(0, 'rgba(100, 200, 255, 0.7)'); // Blue
            gradient.addColorStop(1, 'rgba(150, 255, 200, 0.7)'); // Cyan-green
          }
        } else {
          // Light theme (darker tones for light backgrounds)
          if (normalizedValue > 0.7) {
            gradient.addColorStop(0, 'rgba(220, 38, 38, 0.9)'); // Red
            gradient.addColorStop(0.5, 'rgba(234, 179, 8, 0.9)'); // Yellow
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.9)'); // Green
          } else if (normalizedValue > 0.4) {
            gradient.addColorStop(0, 'rgba(234, 179, 8, 0.8)'); // Yellow
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.8)'); // Green
          } else {
            gradient.addColorStop(0, 'rgba(99, 102, 241, 0.7)'); // Indigo
            gradient.addColorStop(1, 'rgba(34, 197, 94, 0.7)'); // Green
          }
        }

        ctx.fillStyle = gradient;

        // Draw rounded bar
        const y = height - barHeight;
        const radius = Math.min(barWidth / 2, 3);

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, height - radius);
        ctx.quadraticCurveTo(x + barWidth, height, x + barWidth - radius, height);
        ctx.lineTo(x + radius, height);
        ctx.quadraticCurveTo(x, height, x, height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start animation loop
    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isActive, variant]);

  // Reset data array when analyser changes
  useEffect(() => {
    if (analyser) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
    } else {
      dataArrayRef.current = null;
    }
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}

export default AudioVisualizer;
