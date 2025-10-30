import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`
        bg-white border border-gray-200 rounded-xl overflow-hidden
        ${hover ? 'transition-all duration-200 hover:border-indigo-600 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${className}`}>
      {children}
    </div>
  );
}

// Media Card (for images/videos)
interface MediaCardProps {
  thumbnail: string;
  title: string;
  type: 'image' | 'video' | 'audio';
  timestamp?: string;
  description?: string;
  tags?: string[];
  onPlay?: () => void;
  onClick?: () => void;
}

export function MediaCard({
  thumbnail,
  title,
  type,
  timestamp,
  description,
  tags,
  onPlay,
  onClick,
}: MediaCardProps) {
  return (
    <Card hover onClick={onClick}>
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100 group">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover"
        />
        {type === 'video' && onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-indigo-600 ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
        {type === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{title}</h3>

        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
          <span className="capitalize">{type}</span>
          {timestamp && (
            <>
              <span>•</span>
              <span>{timestamp}</span>
            </>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs text-gray-600 line-clamp-2">{description}</p>
        )}

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-indigo-50 text-indigo-600 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

// Metric Card (for dashboard)
interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconColor?: string;
}

export function MetricCard({ icon, label, value, iconColor = 'bg-indigo-50 text-indigo-600' }: MetricCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${iconColor} flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-1">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
