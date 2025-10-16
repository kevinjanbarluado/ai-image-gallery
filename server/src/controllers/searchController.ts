import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function searchImages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const query = req.query.query as string;
    const color = req.query.color as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let dbQuery = supabaseAdmin
      .from('images')
      .select(`
        *,
        metadata:image_metadata(*)
      `, { count: 'exact' })
      .eq('user_id', userId);

    // Filter by text search (tags or description)
    if (query) {
      dbQuery = dbQuery.or(
        `metadata.tags.cs.{${query}},metadata.description.ilike.%${query}%`,
        { foreignTable: 'image_metadata' }
      );
    }

    // Filter by color
    if (color) {
      dbQuery = dbQuery.contains('metadata.colors', [color]);
    }

    const { data: images, error, count } = await dbQuery
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get signed URLs
    const imagesWithUrls = await Promise.all(
      (images || []).map(async (image) => {
        const { data: thumbnailUrl } = await supabaseAdmin.storage
          .from('images')
          .createSignedUrl(image.thumbnail_path, 3600);

        const { data: originalUrl } = await supabaseAdmin.storage
          .from('images')
          .createSignedUrl(image.original_path, 3600);

        return {
          ...image,
          thumbnail_url: thumbnailUrl?.signedUrl,
          original_url: originalUrl?.signedUrl,
          metadata: Array.isArray(image.metadata) ? image.metadata[0] : image.metadata,
        };
      })
    );

    res.json({
      images: imagesWithUrls,
      total: count || 0,
      page,
      limit,
    });
  } catch (error) {
    console.error('Error searching images:', error);
    res.status(500).json({ error: 'Failed to search images' });
  }
}

export async function findSimilarImages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.imageId);
    const limit = parseInt(req.query.limit as string) || 10;

    // Get the source image metadata
    const { data: sourceMetadata, error: sourceError } = await supabaseAdmin
      .from('image_metadata')
      .select('tags, colors')
      .eq('image_id', imageId)
      .eq('user_id', userId)
      .single();

    if (sourceError || !sourceMetadata) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Find images with overlapping tags or colors
    const { data: similarImages, error } = await supabaseAdmin
      .from('images')
      .select(`
        *,
        metadata:image_metadata(*)
      `)
      .eq('user_id', userId)
      .neq('id', imageId)
      .limit(limit * 2); // Get more to filter

    if (error) {
      throw error;
    }

    // Calculate similarity scores
    const imagesWithScores = similarImages
      .map((image) => {
        const metadata = Array.isArray(image.metadata) ? image.metadata[0] : image.metadata;
        if (!metadata) return null;

        // Calculate tag overlap
        const tagOverlap = sourceMetadata.tags.filter((tag: string) =>
          metadata.tags.includes(tag)
        ).length;

        // Calculate color overlap
        const colorOverlap = sourceMetadata.colors.filter((color: string) =>
          metadata.colors.includes(color)
        ).length;

        const score = tagOverlap * 2 + colorOverlap; // Weight tags more

        return {
          ...image,
          metadata,
          similarity_score: score,
        };
      })
      .filter((img) => img !== null && img.similarity_score > 0)
      .sort((a, b) => b!.similarity_score - a!.similarity_score)
      .slice(0, limit);

    // Get signed URLs
    const imagesWithUrls = await Promise.all(
      imagesWithScores.map(async (image) => {
        const { data: thumbnailUrl } = await supabaseAdmin.storage
          .from('images')
          .createSignedUrl(image!.thumbnail_path, 3600);

        const { data: originalUrl } = await supabaseAdmin.storage
          .from('images')
          .createSignedUrl(image!.original_path, 3600);

        return {
          ...image,
          thumbnail_url: thumbnailUrl?.signedUrl,
          original_url: originalUrl?.signedUrl,
        };
      })
    );

    res.json({ images: imagesWithUrls });
  } catch (error) {
    console.error('Error finding similar images:', error);
    res.status(500).json({ error: 'Failed to find similar images' });
  }
}

