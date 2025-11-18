/**
 * Dialog for sharing projects
 */

import { useState, useCallback } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { copyShareableUrl, generateShareableUrl } from '@/lib/collaboration/sharing';
import type { Project } from '@/types';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
}

export default function ShareDialog({ open, onClose, project }: ShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareableUrl = generateShareableUrl(project);

  const handleCopy = useCallback(async () => {
    const success = await copyShareableUrl(project);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [project]);

  return (
    <Dialog open={open} onClose={onClose} title="Share Project">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Share this project by copying the link below. Anyone with the link can import the project.
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <input
            type="text"
            value={shareableUrl}
            readOnly
            className="w-full bg-transparent text-sm text-gray-700 focus:outline-none"
            aria-label="Shareable project URL"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy Link'}
          </Button>
        </div>

        <div className="text-xs text-gray-500 bg-blue-50 border border-blue-200 rounded p-3">
          <strong>Note:</strong> The project data is encoded in the URL. For very large projects, 
          consider using a file sharing service instead.
        </div>
      </div>
    </Dialog>
  );
}

