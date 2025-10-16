import { useEffect, useState } from 'react';
import type { Image } from '../types';
import { findSimilarImages } from '../lib/api';

interface ImageModalProps {
  image: Image;
  onClose: () => void;
  onImageClick: (image: Image) => void;
}

export default function ImageModal({ image, onClose, onImageClick }: ImageModalProps) {
  const [similarImages, setSimilarImages] = useState<Image[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  useEffect(() => {
    loadSimilarImages();
  }, [image.id]);

  const loadSimilarImages = async () => {
    setLoadingSimilar(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;
      
      const response = await findSimilarImages(image.id, token);
      setSimilarImages(response.images);
    } catch (error) {
      console.error('Failed to load similar images:', error);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">{image.filename}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Image */}
          <div className="flex justify-center">
            <img
              src={image.original_url}
              alt={image.filename}
              className="max-w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>

          {/* Metadata */}
          {image.metadata && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">AI Analysis Status:</span>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(
                    image.metadata.ai_processing_status
                  )}`}
                >
                  {image.metadata.ai_processing_status}
                </span>
              </div>

              {image.metadata.ai_processing_status === 'completed' && (
                <>
                  {/* Description */}
                  {image.metadata.description && (
                    <div>
                      <h3 className="font-semibold mb-2">Description:</h3>
                      <p className="text-gray-700">{image.metadata.description}</p>
                    </div>
                  )}

                  {/* Tags */}
                  {image.metadata.tags && image.metadata.tags.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Tags:</h3>
                      <div className="flex flex-wrap gap-2">
                        {image.metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {image.metadata.colors && image.metadata.colors.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Dominant Colors:</h3>
                      <div className="flex gap-3">
                        {image.metadata.colors.map((color, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-lg border-2 border-gray-300"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-sm text-gray-600">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Similar Images */}
          <div>
            <h3 className="font-semibold mb-3">Similar Images:</h3>
            {loadingSimilar ? (
              <p className="text-gray-500">Loading similar images...</p>
            ) : similarImages.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {similarImages.map((simImg) => (
                  <img
                    key={simImg.id}
                    src={simImg.thumbnail_url}
                    alt={simImg.filename}
                    className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-75 transition-opacity"
                    onClick={() => {
                      onClose();
                      onImageClick(simImg);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No similar images found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

