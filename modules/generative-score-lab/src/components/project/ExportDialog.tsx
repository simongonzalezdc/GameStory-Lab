import { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { exportProject } from '@/lib/io/file-system';
import { errorHandler, ErrorSeverity } from '@/lib/errors/error-handler';
import type { Project } from '@/types';

interface ExportDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project;
}

export default function ExportDialog({ open, onClose, project }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      setError('');
      setExportSuccess(false);

      await exportProject(project);

      setExportSuccess(true);
      timeoutRef.current = setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 2000);
    } catch (err) {
      errorHandler.handle(err, 'Project Export', ErrorSeverity.ERROR);
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }, [project, onClose]);

  const handleClose = useCallback(() => {
    if (!exporting) {
      setError('');
      setExportSuccess(false);
      onClose();
    }
  }, [exporting, onClose]);

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      title="Export Project"
      description="Save your project as a JSON file that can be imported later"
    >
      <div className="space-y-4">
        {exportSuccess ? (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            ✓ Project exported successfully!
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600">
              Export your project as a JSON file that can be shared or imported later.
            </div>

            {/* Project Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Project Name:</span>
                <span className="text-sm font-medium text-gray-900">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Scenes:</span>
                <span className="text-sm font-medium text-gray-900">{project.scenes.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Tracks:</span>
                <span className="text-sm font-medium text-gray-900">
                  {project.scenes.reduce((acc, scene) => acc + scene.tracks.length, 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">BPM:</span>
                <span className="text-sm font-medium text-gray-900">{project.bpm}</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500">
              The exported file will be saved to your downloads folder as{' '}
              <code className="bg-gray-100 px-1 py-0.5 rounded">{project.name}.json</code>
            </div>
          </>
        )}

        {/* Actions */}
        {!exportSuccess && (
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={handleClose} disabled={exporting}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
