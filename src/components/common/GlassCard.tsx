import { cn } from '@/lib/utils';
import { forwardRef, HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  hover?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, blur = 'lg', opacity = 0.65, hover = false, children, ...props }, ref) => {
    const blurValues = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-white/40 shadow-lg',
          blurValues[blur],
          hover && 'transition-all duration-200 hover:scale-[1.01] hover:shadow-xl',
          className
        )}
        style={{
          backgroundColor: `rgba(255, 255, 255, ${opacity})`,
          boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.08)',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
