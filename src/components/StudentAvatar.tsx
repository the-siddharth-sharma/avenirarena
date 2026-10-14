interface StudentAvatarProps {
  initials: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  ring?: boolean;
}

export function StudentAvatar({
  initials,
  color = 'from-gold-500 to-gold-700',
  size = 'md',
  ring = false,
}: StudentAvatarProps) {
  const sizes = {
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-lg',
  };

  return (
    <div
      className={`${sizes[size]} rounded-md bg-gradient-to-br ${color} flex items-center justify-center font-semibold text-ivory shrink-0 ${
        ring ? 'ring-1 ring-gold-400/30 ring-offset-2 ring-offset-obsidian' : ''
      }`}
    >
      {initials}
    </div>
  );
}
