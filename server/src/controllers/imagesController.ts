import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function getAllImages(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabaseAdmin
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get images with metadata
    const { data: images, error } = await supabaseAdmin
      .from('images')
      .select(`
        *,
        metadata:image_metadata(*)
      `)
      .eq('user_id', userId)
      .order('uploaded_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Get signed URLs for thumbnails
    const imagesWithUrls = await Promise.all(
      images.map(async (image) => {
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
    console.error('Error fetching images:', error);
    res.status(500).json({ error: 'Failed to fetch images' });
  }
}

export async function getImageById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.id);

    const { data: image, error } = await supabaseAdmin
      .from('images')
      .select(`
        *,
        metadata:image_metadata(*)
      `)
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (error || !image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Get signed URLs
    const { data: thumbnailUrl } = await supabaseAdmin.storage
      .from('images')
      .createSignedUrl(image.thumbnail_path, 3600);

    const { data: originalUrl } = await supabaseAdmin.storage
      .from('images')
      .createSignedUrl(image.original_path, 3600);

    res.json({
      ...image,
      thumbnail_url: thumbnailUrl?.signedUrl,
      original_url: originalUrl?.signedUrl,
      metadata: Array.isArray(image.metadata) ? image.metadata[0] : image.metadata,
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
}

export async function deleteImage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const imageId = parseInt(req.params.id);

    // Get image details
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('images')
      .select('*')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !image) {
      res.status(404).json({ error: 'Image not found' });
      return;
    }

    // Delete from storage
    await supabaseAdmin.storage.from('images').remove([image.original_path, image.thumbnail_path]);

    // Delete metadata first (foreign key constraint)
    await supabaseAdmin.from('image_metadata').delete().eq('image_id', imageId);

    // Delete image record
    const { error: deleteError } = await supabaseAdmin
      .from('images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
}

