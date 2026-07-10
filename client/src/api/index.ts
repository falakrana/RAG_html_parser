import axios from 'axios';
import type { CrawlResponse, ChatResponse } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Calls the POST /api/crawl endpoint to crawl and index the specified website.
 * 
 * @param url - The target website URL to crawl and index.
 * @returns A Promise resolving to the crawl and index statistics.
 */
export async function crawlSite(url: string): Promise<CrawlResponse> {
  const response = await api.post<CrawlResponse>('/crawl', { url });
  return response.data;
}

/**
 * Calls the POST /api/chat endpoint to query the vectorized collection of the site.
 * 
 * @param question - The user's question.
 * @param collectionName - The name of the collection in ChromaDB.
 * @returns A Promise resolving to the assistant's answer and cited sources.
 */
export async function askQuestion(question: string, collectionName: string): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat', { question, collectionName });
  return response.data;
}
export default api;
