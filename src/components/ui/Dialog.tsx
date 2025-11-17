import * as DialogPrimitive from '@radix-ui/react-dialog';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({ open, onOpenChange, onClose, title, description, children, className }: DialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && onClose) {
      onClose();
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fadeIn" />
        <DialogPrimitive.Content
          className={clsx(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
            'bg-white rounded-lg shadow-lg',
            'w-full max-w-md max-h-[85vh] overflow-y-auto',
            'focus:outline-none',
            'data-[state=open]:animate-fadeIn',
            className
          )}
        >
          <div className="p-6">
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </DialogPrimitive.Title>
            {description && (
              <DialogPrimitive.Description className="text-sm text-gray-500 mb-4">
                {description}
              </DialogPrimitive.Description>
            )}
            {children}
          </div>
          <DialogPrimitive.Close
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
