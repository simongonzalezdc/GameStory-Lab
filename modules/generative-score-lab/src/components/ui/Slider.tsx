import * as SliderPrimitive from '@radix-ui/react-slider';
import { clsx } from 'clsx';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  label,
}: SliderProps) {
  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          <span className="text-sm text-gray-500">{value[0]}</span>
        </div>
      )}
      <SliderPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="relative flex items-center select-none touch-none w-full h-5"
      >
        <SliderPrimitive.Track className="bg-gray-200 relative grow rounded-full h-2">
          <SliderPrimitive.Range className="absolute bg-forest-600 rounded-full h-full" />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="block w-5 h-5 bg-white border-2 border-forest-600 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-forest-500 focus:ring-offset-2"
          aria-label={label}
        />
      </SliderPrimitive.Root>
    </div>
  );
}
