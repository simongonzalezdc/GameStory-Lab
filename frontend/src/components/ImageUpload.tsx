import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiClient } from '../services/api';

interface ImageUploadProps {
  onConverted?: () => void;
}

export function ImageUpload({ onConverted }: ImageUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setUploadedFile(file);
      setError(null);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload an image file.');
      } else {
        setError('File rejected. Please try another file.');
      }
    }
  });

  const handleConvert = async () => {
    if (!uploadedFile) return;

    setConverting(true);
    setError(null);
    setSuccess(null);

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Call image-to-sprite conversion API
      const response = await apiClient.convertImageToSprite(formData);

      if (response.success) {
        setSuccess(`Image converted successfully in ${response.generation_time_ms}ms!`);

        // Clear after success and trigger library refresh
        setTimeout(() => {
          handleClear();
          onConverted?.();
        }, 1500);
      } else {
        setError(response.error || 'Conversion failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  const handleClear = () => {
    setUploadedFile(null);
    setPreviewUrl(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Upload className="text-purple-500" />
        Image-to-Sprite Conversion
      </h2>

      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${isDragActive
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div className={`
              p-4 rounded-full transition-colors
              ${isDragActive ? 'bg-purple-100' : 'bg-gray-100'}
            `}>
              <ImageIcon size={48} className={isDragActive ? 'text-purple-500' : 'text-gray-400'} />
            </div>

            {isDragActive ? (
              <p className="text-lg font-medium text-purple-600">
                Drop your image here
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-gray-700">
                  Drag & drop an image here
                </p>
                <p className="text-sm text-gray-500">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supported: PNG, JPG, GIF, WebP (max 10MB)
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Preview */}
          <div className="relative border-2 border-gray-200 rounded-lg overflow-hidden">
            <img
              src={previewUrl || ''}
              alt="Preview"
              className="w-full h-auto max-h-96 object-contain bg-gray-100"
            />
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition"
              title="Remove image"
            >
              <X size={20} />
            </button>
          </div>

          {/* File Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700">
              {uploadedFile.name}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(uploadedFile.size / 1024).toFixed(2)} KB
            </p>
          </div>

          {/* Conversion Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Conversion Process:</strong> Optimizes image for game use with transparent background,
              automatic resizing, and PNG compression.
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3">
              {success}
            </div>
          )}

          {/* Convert Button */}
          <button
            onClick={handleConvert}
            disabled={converting}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {converting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Converting...
              </>
            ) : (
              <>
                <Upload size={20} />
                Convert to Sprite
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
