import sharp from 'sharp';
import { config } from '../config/index.js';

export async function createThumbnail(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer)
      .resize(config.upload.thumbnailSize, config.upload.thumbnailSize, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new Error('Failed to create thumbnail');
  }
}

export async function validateImage(buffer: Buffer): Promise<boolean> {
  try {
    const metadata = await sharp(buffer).metadata();
    return !!metadata.format && ['jpeg', 'png'].includes(metadata.format);
  } catch (error) {
    return false;
  }
}

