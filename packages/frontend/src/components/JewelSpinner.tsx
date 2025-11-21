/**
 * Jewel Spinner Component
 * Standard loading spinner for the entire application
 */

interface JewelSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export function JewelSpinner({ size = 'md', className = '' }: JewelSpinnerProps) {
  return (
    <div className={`jewel-spinner ${sizeClasses[size]} ${className}`}>
      <div className="jewel-spinner-core" />
    </div>
  );
}

