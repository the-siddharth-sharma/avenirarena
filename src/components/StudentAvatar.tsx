import { useState } from 'react';

interface StudentAvatarProps {
  initials: string;
  photoURL?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
}

export function StudentAvatar({
  initials,
  photoURL,
  color = 'from-gold-500 to-gold-700',
  size = 'md',
  ring = false,
}: StudentAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  };

  const showImage = Boolean(photoURL) && !imageError;

  return (
    <div
      className={`${sizes[size]} rounded-md overflow-hidden bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-ivory shrink-0 select-none ${
        ring ? 'ring-1 ring-gold-400/30 ring-offset-2 ring-offset-obsidian' : ''
      }`}
    >
      {showImage ? (
        <img
          src={photoURL}
          alt={initials || 'User'}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
