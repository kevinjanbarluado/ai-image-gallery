-- AI Image Gallery Database Schema
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. Create Tables
-- ============================================

-- Images table
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_path TEXT NOT NULL,
  thumbnail_path TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Image metadata table
CREATE TABLE IF NOT EXISTS image_metadata (
  id SERIAL PRIMARY KEY,
  image_id INTEGER REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  colors VARCHAR(7)[] DEFAULT '{}',
  ai_processing_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_status CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed'))
);

-- ============================================
-- 2. Create Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at ON images(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_metadata_image_id ON image_metadata(image_id);
CREATE INDEX IF NOT EXISTS idx_metadata_user_id ON image_metadata(user_id);
CREATE INDEX IF NOT EXISTS idx_metadata_tags ON image_metadata USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_metadata_colors ON image_metadata USING GIN(colors);
CREATE INDEX IF NOT EXISTS idx_metadata_status ON image_metadata(ai_processing_status);

-- Full text search index on description
CREATE INDEX IF NOT EXISTS idx_metadata_description ON image_metadata USING GIN(to_tsvector('english', description));

-- ============================================
-- 3. Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_metadata ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. Create RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see own images" ON images;
DROP POLICY IF EXISTS "Users can only insert own images" ON images;
DROP POLICY IF EXISTS "Users can only update own images" ON images;
DROP POLICY IF EXISTS "Users can only delete own images" ON images;

DROP POLICY IF EXISTS "Users can only see own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can only insert own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can only update own metadata" ON image_metadata;
DROP POLICY IF EXISTS "Users can only delete own metadata" ON image_metadata;

-- Images policies
CREATE POLICY "Users can only see own images"
  ON images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own images"
  ON images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own images"
  ON images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete own images"
  ON images FOR DELETE
  USING (auth.uid() = user_id);

-- Image metadata policies
CREATE POLICY "Users can only see own metadata"
  ON image_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert own metadata"
  ON image_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update own metadata"
  ON image_metadata FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete own metadata"
  ON image_metadata FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. Create Storage Bucket
-- ============================================

-- Note: Run this in Supabase Dashboard or via SQL
-- Create 'images' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for images bucket
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Done! 
-- ============================================
-- Your database is now ready for the AI Image Gallery application.

