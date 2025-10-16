import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../lib/supabase.js';
import { validateImage, createThumbnail } from '../lib/imageProcessor.js';
import { processImageAI } from '../services/aiProcessor.js';
import { v4 as uuidv4 } from 'uuid';

export async function uploadImage(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const results = [];

    for (const file of files) {
      try {
        // Validate image
        const isValid = await validateImage(file.buffer);
        if (!isValid) {
          results.push({
            filename: file.originalname,
            error: 'Invalid image format',
          });
          continue;
        }

        // Generate unique filename
        const fileExt = file.originalname.split('.').pop();
        const uniqueFilename = `${uuidv4()}.${fileExt}`;
        const originalPath = `${userId}/${uniqueFilename}`;
        const thumbnailPath = `${userId}/thumbnails/${uniqueFilename}`;

        // Create thumbnail
        const thumbnailBuffer = await createThumbnail(file.buffer);

        // Upload original to Supabase Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from('images')
          .upload(originalPath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        // Upload thumbnail
        await supabaseAdmin.storage
          .from('images')
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        // Insert into database
        const { data: image, error: dbError } = await supabaseAdmin
          .from('images')
          .insert({
            user_id: userId,
            filename: file.originalname,
            original_path: originalPath,
            thumbnail_path: thumbnailPath,
          })
          .select()
          .single();

        if (dbError) {
          throw dbError;
        }

        // Create metadata record with pending status
        const { data: metadata } = await supabaseAdmin
          .from('image_metadata')
          .insert({
            image_id: image.id,
            user_id: userId,
            ai_processing_status: 'pending',
            tags: [],
            colors: [],
          })
          .select()
          .single();

        // Process AI analysis in background (non-blocking)
        processImageAI(image.id, file.buffer, file.mimetype).catch((error) => {
          console.error(`Failed to process image ${image.id}:`, error);
        });

        results.push({
          success: true,
          image,
          metadata,
        });
      } catch (error) {
        console.error('Error processing file:', error);
        results.push({
          filename: file.originalname,
          error: 'Failed to process image',
        });
      }
    }

    res.json({ results });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
}

