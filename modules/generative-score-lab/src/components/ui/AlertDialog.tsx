import { Dialog } from './Dialog';
import { Button } from './Button';

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onClose?: () => void;
  buttonLabel?: string;
  variant?: 'info' | 'warning' | 'error';
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  onClose,
  buttonLabel = 'OK',
  variant = 'info',
}: AlertDialogProps) {
  const handleClose = () => {
    onClose?.();
    onOpenChange(false);
  };

  const iconMap = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">{iconMap[variant]}</span>
        <p className="text-gray-700">{description}</p>
      </div>
      <div className="flex justify-end mt-6">
        <Button onClick={handleClose}>{buttonLabel}</Button>
      </div>
    </Dialog>
  );
}
