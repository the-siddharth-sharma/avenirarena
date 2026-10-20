interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <img
      src="/assets/images/image.png"
      alt="AVENIR ARENA official logo"
      width={size}
      height={size}
      className={`object-contain max-w-full max-h-full ${className}`}
    />
  );
}
