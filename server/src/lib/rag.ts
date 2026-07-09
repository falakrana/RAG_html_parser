import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCollection, queryCollection } from './vectorstore';
import { embedTexts } from './embedder';
import { Source } from '../types';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Answers a user question based strictly on the content indexed in the specified ChromaDB collection.
 * Embeds the question, retrieves top-5 matching documents, builds a strict context, and queries Gemini 2.5 Flash.
 * 
 * @param question - The user's query/question.
 * @param collectionName - The ChromaDB collection containing the website's indexed content.
 * @returns A Promise resolving to the generated answer and the unique source references used.
 * @throws Error if the collection cannot be found, API fails, or environment keys are missing.
 */
export async function answerQuestion(
  question: string,
  collectionName: string
): Promise<{ answer: string; sources: Source[] }> {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing. Please configure it in your server/.env file.');
  }

  // 1. Embed the question
  const questionEmbeddings = await embedTexts([question]);
  if (questionEmbeddings.length === 0) {
    throw new Error('Failed to generate embedding for the question.');
  }
  const queryEmbedding = questionEmbeddings[0];

  // 2. Query ChromaDB with the question embedding (nResults = 5)
  const collection = await getCollection(collectionName);
  const queryResults = await queryCollection(collection, queryEmbedding, 5);

  const matchedDocs = queryResults.documents[0] || [];
  const matchedMetadatas = (queryResults.metadatas[0] || []) as Array<{
    url?: string;
    title?: string;
    chunkIndex?: number;
  } | null>;

  // 3. Build context string from returned documents
  const context = matchedDocs
    .filter((doc): doc is string => typeof doc === 'string' && doc.trim().length > 0)
    .join('\n\n---\n\n');

  // 4. Call Gemini 2.5 Flash with strict system instructions
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a helpful assistant that answers questions strictly based on the provided website content.

Rules:
- Only use information from the CONTEXT below.
- If the context doesn't contain enough information, respond with:
  "I couldn't find information about that on this website."
- Do not use external knowledge or make up facts.
- Be concise and direct.

CONTEXT:
${context}`,
  });

  const chatResult = await model.generateContent(question);
  const answer = chatResult.response.text()?.trim() || "I couldn't find information about that on this website.";

  // 5. Extract unique sources from matched metadata
  const sources: Source[] = [];
  const seenUrls = new Set<string>();

  for (const meta of matchedMetadatas) {
    if (meta && meta.url) {
      const url = meta.url;
      const title = meta.title || 'Untitled';
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        sources.push({ url, title });
      }
    }
  }

  // 6. Return answer and sources
  return {
    answer,
    sources,
  };
}
