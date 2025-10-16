export interface Image {
  id: number;
  user_id: string;
  filename: string;
  original_path: string;
  thumbnail_path: string;
  uploaded_at: string;
}

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

export interface AIAnalysisResult {
  description: string;
  tags: string[];
  colors: string[];
}

export interface UploadResponse {
  success: boolean;
  image?: Image;
  metadata?: ImageMetadata;
  error?: string;
}

export interface SearchParams {
  query?: string;
  color?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  images: Array<Image & { metadata?: ImageMetadata }>;
  total: number;
  page: number;
  limit: number;
}

export interface SimilarImagesParams {
  imageId: number;
  limit?: number;
}

