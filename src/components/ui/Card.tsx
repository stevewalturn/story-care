import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export function Card({ children, className = '', hover = false, onClick }: CardProps) {
  return (
    <div
      className={`
        overflow-hidden rounded-xl border border-gray-200 bg-white
        ${hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-600 hover:shadow-lg' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
};

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-gray-200 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`border-t border-gray-200 bg-gray-50 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

// Media Card (for images/videos)
type MediaCardProps = {
  thumbnail: string;
  title: string;
  type: 'image' | 'video' | 'audio';
  timestamp?: string;
  description?: string;
  tags?: string[];
  onPlay?: () => void;
  onClick?: () => void;
};

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
      <div className="group relative aspect-video bg-gray-100">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover"
        />
        {type === 'video' && onPlay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90">
              <svg className="ml-1 h-8 w-8 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        )}
        {type === 'audio' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{title}</h3>

        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <span className="capitalize">{type}</span>
          {timestamp && (
            <>
              <span>•</span>
              <span>{timestamp}</span>
            </>
          )}
        </div>

        {description && (
          <p className="mt-2 line-clamp-2 text-xs text-gray-600">{description}</p>
        )}

        {tags && tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <span
                key={tag}
                className="rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-600"
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
type MetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string | number;
  iconColor?: string;
};

export function MetricCard({ icon, label, value, iconColor = 'bg-indigo-50 text-indigo-600' }: MetricCardProps) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-xl ${iconColor} flex flex-shrink-0 items-center justify-center`}>
          {icon}
        </div>
        <div>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          <p className="mt-1 text-sm text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}
