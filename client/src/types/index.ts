export interface GalleryImage {
  id: number;
  user_id: string;
  filename: string;
  original_path: string;
  thumbnail_path: string;
  uploaded_at: string;
  thumbnail_url?: string;
  original_url?: string;
  metadata?: ImageMetadata;
}

// Export as Image for backward compatibility
export type Image = GalleryImage;

export interface ImageMetadata {
  id: number;
  image_id: number;
  user_id: string;
  description: string | null;
  tags: string[];
  colors: string[];
  ai_processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

