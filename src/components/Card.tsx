import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  spotlight?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  hover = false,
  spotlight = true,
  onClick,
}: CardProps) {
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!spotlight) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`card ${hover ? 'card-hover' : ''} ${spotlight ? 'card-spotlight' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
