import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

// Initialize the Google Generative AI client
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Generates vector embeddings for a given array of texts using the Gemini gemini-embedding-2 model.
 * Processes texts in batches of 20 with a 200ms delay between batches to respect API rate limits.
 * 
 * @param texts - The array of text strings to embed.
 * @returns A Promise resolving to a 2D array of numbers representing the text embeddings.
 * @throws Error if GEMINI_API_KEY is missing or if the API request fails.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your server/.env file.');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });
  const allEmbeddings: number[][] = [];
  const batchSize = 20;

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    // Embed the current batch concurrently
    const batchPromises = batch.map(async (text) => {
      try {
        const result = await model.embedContent(text);
        if (!result.embedding || !result.embedding.values) {
          throw new Error(`Embedding result empty for text: "${text.substring(0, 30)}..."`);
        }
        return result.embedding.values;
      } catch (error) {
        console.error(`Error embedding text segment:`, error);
        throw error;
      }
    });

    const batchEmbeddings = await Promise.all(batchPromises);
    allEmbeddings.push(...batchEmbeddings);

    // If there are more batches left, wait 200ms before starting the next batch
    if (i + batchSize < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return allEmbeddings;
}
