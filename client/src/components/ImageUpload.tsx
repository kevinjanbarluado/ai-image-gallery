import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImages } from '../lib/api';

interface ImageUploadProps {
  onUploadComplete: () => void;
}

export default function ImageUpload({ onUploadComplete }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setError('');
    setProgress(0);

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) throw new Error('Not authenticated');

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 300);

      await uploadImages(acceptedFiles, token);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        onUploadComplete();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to upload images');
      setUploading(false);
      setProgress(0);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    maxSize: 10485760, // 10MB
    multiple: true,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        
        {uploading ? (
          <div className="space-y-2">
            <p className="text-gray-600">Uploading... {progress}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">
              {isDragActive
                ? 'Drop the images here...'
                : 'Drag and drop images here, or click to select'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPEG or PNG, up to 10MB each
            </p>
          </>
        )}
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}

