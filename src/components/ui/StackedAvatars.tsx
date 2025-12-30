'use client';

type Member = {
  id: string;
  name: string;
  avatarUrl?: string | null;
};

type StackedAvatarsProps = {
  members: Member[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
};

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const overlapClasses = {
  sm: '-ml-2',
  md: '-ml-3',
  lg: '-ml-4',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function StackedAvatars({
  members,
  maxVisible = 3,
  size = 'md',
}: StackedAvatarsProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const remainingCount = members.length - maxVisible;

  return (
    <div className="flex items-center">
      {visibleMembers.map((member, index) => (
        <div
          key={member.id}
          className={`relative ${index > 0 ? overlapClasses[size] : ''}`}
          style={{ zIndex: maxVisible - index }}
        >
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className={`${sizeClasses[size]} rounded-full border-2 border-white object-cover`}
            />
          ) : (
            <div
              className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-purple-400 to-purple-600 font-medium text-white`}
            >
              {getInitials(member.name)}
            </div>
          )}
        </div>
      ))}
      {remainingCount > 0 && (
        <div
          className={`${overlapClasses[size]} relative flex ${sizeClasses[size]} items-center justify-center rounded-full border-2 border-white bg-gray-100 font-medium text-gray-600`}
          style={{ zIndex: 0 }}
        >
          +
          {remainingCount}
        </div>
      )}
    </div>
  );
}
