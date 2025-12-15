import { cn } from '@/lib/utils';

interface RingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RingSpinner({ size = 'md', className }: RingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-blue-500 border-t-transparent',
        sizeClasses[size],
        className
      )}
    />
  );
}
