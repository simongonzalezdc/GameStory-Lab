import { LucideIcon, LucideProps } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '../lib/utils';

interface IconProps extends Omit<LucideProps, 'ref'> {
  icon: LucideIcon;
  className?: string;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ icon: IconComponent, className, ...props }, ref) => {
    return (
      <IconComponent
        ref={ref}
        className={cn('h-4 w-4', className)}
        {...props}
      />
    );
  }
);

Icon.displayName = 'Icon';

// Common icon exports for convenience
export { default as icons } from 'lucide-react';
