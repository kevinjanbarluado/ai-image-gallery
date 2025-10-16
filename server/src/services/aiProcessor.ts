import { supabaseAdmin } from '../lib/supabase.js';
import { analyzeImage } from '../lib/gemini.js';

// Simple in-memory queue for background processing
const processingQueue: Array<{
  imageId: number;
  buffer: Buffer;
  mimeType: string;
}> = [];

let isProcessing = false;

export async function processImageAI(
  imageId: number,
  buffer: Buffer,
  mimeType: string
): Promise<void> {
  // Add to queue
  processingQueue.push({ imageId, buffer, mimeType });

  // Start processing if not already running
  if (!isProcessing) {
    processQueue();
  }
}

async function processQueue(): Promise<void> {
  if (processingQueue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = processingQueue.shift()!;

  try {
    // Update status to processing
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'processing' })
      .eq('image_id', job.imageId);

    // Analyze with Gemini
    const result = await analyzeImage(job.buffer, job.mimeType);

    // Update metadata with results
    await supabaseAdmin
      .from('image_metadata')
      .update({
        description: result.description,
        tags: result.tags,
        colors: result.colors,
        ai_processing_status: 'completed',
      })
      .eq('image_id', job.imageId);

    console.log(`Successfully processed image ${job.imageId}`);
  } catch (error) {
    console.error(`Failed to process image ${job.imageId}:`, error);

    // Mark as failed
    await supabaseAdmin
      .from('image_metadata')
      .update({ ai_processing_status: 'failed' })
      .eq('image_id', job.imageId);
  }

  // Process next item with a small delay to respect rate limits
  setTimeout(() => processQueue(), 1000);
}

// Get queue status
export function getQueueStatus() {
  return {
    pending: processingQueue.length,
    isProcessing,
  };
}

