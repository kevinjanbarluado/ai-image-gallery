import { useState, useEffect } from 'react';
import type { Image } from '../types';
import { getImages, searchImages, deleteImage } from '../lib/api';
import ImageUpload from '../components/ImageUpload';
import SearchBar from '../components/SearchBar';
import ImageModal from '../components/ImageModal';
import Navbar from '../components/Navbar';

export default function Gallery() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const limit = 20;

  useEffect(() => {
    loadImages();
  }, [page, searchQuery, colorFilter]);

  const loadImages = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      let response;
      if (searchQuery || colorFilter) {
        response = await searchImages(searchQuery, colorFilter, page, limit, token);
      } else {
        response = await getImages(page, limit, token);
      }

      setImages(response.images);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handleColorFilter = (color: string) => {
    setColorFilter(color);
    setPage(1);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      await deleteImage(id, token);
      loadImages();
    } catch (error) {
      console.error('Failed to delete image:', error);
      alert('Failed to delete image');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Upload Images</h2>
          <ImageUpload onUploadComplete={loadImages} />
        </div>

        {/* Search Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Search & Filter</h2>
          <SearchBar onSearch={handleSearch} onColorFilter={handleColorFilter} />
        </div>

        {/* Gallery Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Your Gallery ({total} {total === 1 ? 'image' : 'images'})
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">
                {searchQuery || colorFilter
                  ? 'No images found matching your search'
                  : 'No images yet. Upload some to get started!'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="group relative aspect-square">
                    <img
                      src={image.thumbnail_url}
                      alt={image.filename}
                      className="w-full h-full object-cover rounded-lg cursor-pointer transition-transform group-hover:scale-105"
                      onClick={() => setSelectedImage(image)}
                    />
                    
                    {/* AI Status Badge */}
                    {image.metadata && (
                      <div className="absolute top-2 left-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            image.metadata.ai_processing_status === 'completed'
                              ? 'bg-green-500 text-white'
                              : image.metadata.ai_processing_status === 'processing'
                              ? 'bg-blue-500 text-white'
                              : image.metadata.ai_processing_status === 'failed'
                              ? 'bg-red-500 text-white'
                              : 'bg-yellow-500 text-white'
                          }`}
                        >
                          {image.metadata.ai_processing_status === 'completed' ? '✓' : '⋯'}
                        </span>
                      </div>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(image.id);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onImageClick={setSelectedImage}
        />
      )}
    </div>
  );
}

