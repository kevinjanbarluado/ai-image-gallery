import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/index.js';
import { AIAnalysisResult } from '../types/index.js';

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export async function analyzeImage(imageBuffer: Buffer, mimeType: string): Promise<AIAnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    const prompt = `Analyze this image and provide:
1. A single descriptive sentence about the image (max 150 characters)
2. 5-10 relevant tags (single words or short phrases, comma-separated)
3. The top 3 dominant colors in hex format (e.g., #FF5733)

Format your response exactly as:
DESCRIPTION: [your description here]
TAGS: [tag1, tag2, tag3, ...]
COLORS: [#color1, #color2, #color3]`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType,
      },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse the response
    const descMatch = text.match(/DESCRIPTION:\s*(.+?)(?=\n|$)/);
    const tagsMatch = text.match(/TAGS:\s*(.+?)(?=\n|$)/);
    const colorsMatch = text.match(/COLORS:\s*(.+?)(?=\n|$)/);

    const description = descMatch ? descMatch[1].trim() : 'No description available';
    
    const tags = tagsMatch
      ? tagsMatch[1]
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0)
          .slice(0, 10)
      : [];

    const colors = colorsMatch
      ? colorsMatch[1]
          .match(/#[0-9A-Fa-f]{6}/g)
          ?.slice(0, 3) || []
      : [];

    return {
      description,
      tags,
      colors,
    };
  } catch (error) {
    console.error('Error analyzing image with Gemini:', error);
    throw new Error('Failed to analyze image');
  }
}

